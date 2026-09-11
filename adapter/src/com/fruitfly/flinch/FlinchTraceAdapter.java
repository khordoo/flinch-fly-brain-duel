package com.fruitfly.flinch;

import com.fruitfly.brain.Connectome;
import com.fruitfly.brain.LifConfig;
import com.fruitfly.brain.LifNetwork;
import com.fruitfly.brain.PopulationIndex;
import com.fruitfly.brain.RetinaGeometry;
import com.fruitfly.brain.SensoryEncoders;
import com.fruitfly.brain.SensoryFrame;

import java.io.BufferedWriter;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.zip.GZIPOutputStream;

/** Minimal offline FLINCH adapter. It receives geometry only and never reads collision labels. */
public final class FlinchTraceAdapter {
    private static final double DT_MS = 0.5;
    private static final double BIN_MS = 5.0;
    private static final long[] SEEDS = {41001, 41002, 41003, 41004, 41005};

    private record Trial(String id, String hash, double onsetMs, double durationMs,
                         double px, double py, double pz, double vx, double vy, double vz, double radius) {}
    private record Event(double t, int lc4, int lplc2, int dnp01) {}

    public static void main(String[] args) throws Exception {
        if (args.length != 7) {
            throw new IllegalArgumentException("usage: <flyb> <fixture-tsv> <out-dir> <engine-commit> <dataset-sha256> <parameters-sha256> <adapter-version>");
        }
        Path flyb = Path.of(args[0]), fixtures = Path.of(args[1]), out = Path.of(args[2]);
        Files.createDirectories(out);
        List<Trial> trials = readTrials(fixtures);
        Connectome c;
        try (FileInputStream in = new FileInputStream(flyb.toFile())) { c = Connectome.load(in); }
        PopulationIndex pi = new PopulationIndex(c);
        RetinaGeometry geom = new RetinaGeometry(c);
        int[] lc4 = pi.resolve("LC4");
        int[] lplc2 = pi.resolve("LPLC2");
        int[] dnp01 = pi.resolve("DNp01");
        int[] silenced = concat(lc4, lplc2);
        if (lc4.length == 0 || lplc2.length == 0 || dnp01.length == 0) {
            throw new IllegalStateException("required population missing: LC4=" + lc4.length + " LPLC2=" + lplc2.length + " DNp01=" + dnp01.length);
        }
        writeSoma(out.resolve("brain-soma.csv.gz"), c);

        Path runCsv = out.resolve("adapter-runs.csv");
        try (BufferedWriter summary = Files.newBufferedWriter(runCsv, StandardCharsets.UTF_8)) {
            summary.write("trial_id,trial_hash,seed,condition,escape_sim_ms,lc4_spikes,lplc2_spikes,dnp01_spikes,wall_compute_ms,trace_file\n");
            int done = 0;
            for (Trial trial : trials) for (long seed : SEEDS) for (boolean intervention : new boolean[]{false, true}) {
                RunResult result = run(c, geom, pi, trial, seed, intervention, lc4, lplc2, dnp01, silenced);
                String condition = intervention ? "sensory_outputs_silenced" : "baseline";
                String filename = trial.id + "-seed-" + seed + "-" + condition + ".json";
                writeTrace(out.resolve(filename), c, trial, seed, intervention, silenced, result,
                        args[3], args[4], args[5], args[6]);
                summary.write(csv(trial.id) + "," + trial.hash + "," + seed + "," + condition + ","
                        + (result.escapeMs == null ? "" : fmt(result.escapeMs)) + "," + result.lc4Total + ","
                        + result.lplc2Total + "," + result.dnp01Total + "," + fmt(result.wallMs) + "," + filename + "\n");
                summary.flush();
                done++;
                System.out.printf(Locale.ROOT, "%3d/100 %s seed=%d %s escape=%s wall=%.1fms%n",
                        done, trial.id, seed, condition, result.escapeMs == null ? "null" : fmt(result.escapeMs), result.wallMs);
            }
        }
    }

    private record RunResult(Double escapeMs, int lc4Total, int lplc2Total, int dnp01Total,
                             double wallMs, List<Event> events, String initialStateHash) {}

    private static RunResult run(Connectome c, RetinaGeometry geom, PopulationIndex pi, Trial tr, long seed,
                                 boolean intervention, int[] lc4, int[] lplc2, int[] dnp01, int[] silenced) throws Exception {
        LifConfig cfg = new LifConfig();
        cfg.dtMs = DT_MS;
        cfg.seed = seed;
        cfg.spikeLogCapacity = 0; // prevents telemetry reservoir sampling from perturbing the stimulus RNG stream
        LifNetwork net = new LifNetwork(c, cfg);
        SensoryEncoders.Params ep = new SensoryEncoders.Params();
        ep.olfaction = false; ep.gustation = false; ep.mechanosensation = false; ep.thermoHygro = false;
        SensoryEncoders enc = new SensoryEncoders(c, pi, geom, ep);
        if (intervention) net.setOutputSilenced(silenced, true);
        for (int id : silenced) if (net.outputSilenced(id) != intervention) throw new IllegalStateException("silencing verification failed");

        String initialHash = sha256("seed=" + seed + ";dt=" + DT_MS + ";gain=" + cfg.gain + ";trial=" + tr.hash);
        SensoryFrame frame = new SensoryFrame();
        frame.luminance = new float[geom.columnCount()];
        Arrays.fill(frame.luminance, 0.5f);
        List<Event> events = new ArrayList<>();
        Double escape = null;
        int lc4Total = 0, lplc2Total = 0, dnpTotal = 0;
        double previousSize = Double.NaN;
        long start = System.nanoTime();
        int bins = (int) Math.ceil(tr.durationMs / BIN_MS);
        for (int b = 0; b < bins; b++) {
            double t = b * BIN_MS;
            frame.objects.clear();
            Arrays.fill(frame.luminance, 0.5f);
            if (t >= tr.onsetMs) {
                double elapsedS = (t - tr.onsetMs) / 1000.0;
                double x = tr.px + tr.vx * elapsedS, y = tr.py + tr.vy * elapsedS, z = tr.pz + tr.vz * elapsedS;
                if (z > 0) {
                    double distance = Math.sqrt(x*x + y*y + z*z);
                    double az = Math.toDegrees(Math.atan2(x, z));
                    double el = Math.toDegrees(Math.atan2(y, Math.sqrt(x*x + z*z)));
                    double size = Math.toDegrees(2.0 * Math.atan2(tr.radius, distance));
                    double expansion = Double.isNaN(previousSize) ? 0 : (size - previousSize) * 1000.0 / BIN_MS;
                    double angularSpeed = Math.abs(Math.toDegrees((z * tr.vx - x * tr.vz) / Math.max(1e-12, x*x + z*z)));
                    SensoryFrame.VisualObject obj = new SensoryFrame.VisualObject((float)az, (float)el, (float)size,
                            (float)expansion, (float)angularSpeed, false);
                    frame.objects.add(obj);
                    for (int ci : geom.columnsWithin(az, el, size / 2.0)) frame.luminance[ci] = 0.05f;
                    previousSize = size;
                }
            }
            enc.apply(frame, net, BIN_MS);
            int steps = (int)Math.round(BIN_MS / DT_MS);
            for (int s = 0; s < steps; s++) {
                int before = net.spikesThisTick(dnp01);
                net.step();
                int after = net.spikesThisTick(dnp01);
                double now = t + (s + 1) * DT_MS;
                if (escape == null && now >= tr.onsetMs && after > before) escape = now;
            }
            int a = net.spikesThisTick(lc4), p = net.spikesThisTick(lplc2), d = net.spikesThisTick(dnp01);
            lc4Total += a; lplc2Total += p; dnpTotal += d;
            events.add(new Event(Math.min(tr.durationMs, t + BIN_MS), a, p, d));
            net.endTick(BIN_MS);
        }
        double wallMs = (System.nanoTime() - start) / 1e6;
        return new RunResult(escape, lc4Total, lplc2Total, dnpTotal, wallMs, events, initialHash);
    }

    private static void writeTrace(Path path, Connectome c, Trial tr, long seed, boolean intervention,
                                   int[] silenced, RunResult r, String commit, String datasetHash,
                                   String paramsHash, String adapterVersion) throws Exception {
        StringBuilder j = new StringBuilder(32768);
        j.append("{\n  \"trialHash\":\"").append(tr.hash).append("\",\n")
         .append("  \"initialStateHash\":\"").append(r.initialStateHash).append("\",\n")
         .append("  \"seed\":").append(seed).append(",\n")
         .append("  \"dataset\":").append(q(c.dataset)).append(",\n")
         .append("  \"datasetVersion\":\"male-cns-v1.0\",\n")
         .append("  \"datasetSha256\":\"").append(datasetHash).append("\",\n")
         .append("  \"engineCommit\":\"").append(commit).append("\",\n")
         .append("  \"parametersHash\":\"").append(paramsHash).append("\",\n")
         .append("  \"encoderVersion\":\"").append(adapterVersion).append("+SensoryEncoders\",\n")
         .append("  \"readoutVersion\":\"DNp01-any-spike-v1\",\n")
         .append("  \"simulatedNeurons\":").append(c.n).append(",\n")
         .append("  \"visualizedNeurons\":").append(somaCount(c)).append(",\n")
         .append("  \"dtMs\":").append(DT_MS).append(",\n")
         .append("  \"telemetryBinMs\":").append(BIN_MS).append(",\n")
         .append("  \"triggerResolutionMs\":").append(DT_MS).append(",\n")
         .append("  \"inputOnsetSimMs\":").append(fmt(tr.onsetMs)).append(",\n")
         .append("  \"escapeSimMs\":").append(r.escapeMs == null ? "null" : fmt(r.escapeMs)).append(",\n")
         .append("  \"intervention\":");
        if (!intervention) j.append("null,\n");
        else {
            j.append("{\"mechanism\":\"LC4+LPLC2 spikes recorded; outgoing synaptic transmission suppressed\",\"neuronIds\":[");
            for (int i = 0; i < silenced.length; i++) { if (i > 0) j.append(','); j.append(q(Long.toString(c.bodyId[silenced[i]]))); }
            j.append("]},\n");
        }
        j.append("  \"populationEvents\":[\n");
        boolean first = true;
        for (Event e : r.events) for (int k = 0; k < 3; k++) {
            if (!first) j.append(",\n"); first = false;
            String pop = k == 0 ? "LC4" : k == 1 ? "LPLC2" : "DNp01";
            int spikes = k == 0 ? e.lc4 : k == 1 ? e.lplc2 : e.dnp01;
            j.append("    {\"tMs\":").append(fmt(e.t)).append(",\"population\":").append(q(pop)).append(",\"spikes\":").append(spikes).append('}');
        }
        j.append("\n  ],\n  \"wallComputeMs\":").append(fmt(r.wallMs))
         .append(",\n  \"simulatedDurationMs\":").append(fmt(tr.durationMs)).append("\n}\n");
        Files.writeString(path, j.toString(), StandardCharsets.UTF_8);
    }

    private static List<Trial> readTrials(Path path) throws Exception {
        List<Trial> out = new ArrayList<>();
        for (String line : Files.readAllLines(path, StandardCharsets.UTF_8)) {
            if (line.isBlank() || line.startsWith("id\t")) continue;
            String[] x = line.split("\\t");
            if (x.length != 11) throw new IllegalArgumentException("bad fixture row: " + line);
            out.add(new Trial(x[0], x[1], d(x[2]), d(x[3]), d(x[4]), d(x[5]), d(x[6]), d(x[7]), d(x[8]), d(x[9]), d(x[10])));
        }
        if (out.size() != 10) throw new IllegalArgumentException("expected 10 trajectories, got " + out.size());
        return out;
    }

    private static int[] concat(int[] a, int[] b) { int[] c = Arrays.copyOf(a, a.length + b.length); System.arraycopy(b, 0, c, a.length, b.length); return c; }
    private static int somaCount(Connectome c) {
        int n = 0; for (int i = 0; i < c.n; i++) if (Float.isFinite(c.soma[3*i]) && Float.isFinite(c.soma[3*i+1]) && Float.isFinite(c.soma[3*i+2])) n++; return n;
    }
    private static void writeSoma(Path path, Connectome c) throws Exception {
        try (BufferedWriter w = new BufferedWriter(new java.io.OutputStreamWriter(new GZIPOutputStream(Files.newOutputStream(path)), StandardCharsets.UTF_8))) {
            w.write("body_id,x_voxel,y_voxel,z_voxel,type\n");
            for (int i = 0; i < c.n; i++) {
                float x = c.soma[3*i], y = c.soma[3*i+1], z = c.soma[3*i+2];
                if (!Float.isFinite(x) || !Float.isFinite(y) || !Float.isFinite(z)) continue;
                w.write(c.bodyId[i] + "," + x + "," + y + "," + z + "," + csv(c.type(i)) + "\n");
            }
        }
    }
    private static double d(String s) { return Double.parseDouble(s); }
    private static String fmt(double x) { return String.format(Locale.ROOT, "%.3f", x); }
    private static String csv(String s) { return s.indexOf(',') < 0 ? s : '"' + s.replace("\"", "\"\"") + '"'; }
    private static String q(String s) { return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""; }
    private static String sha256(String s) throws Exception {
        byte[] h = MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
        StringBuilder b = new StringBuilder(); for (byte x : h) b.append(String.format("%02x", x)); return b.toString();
    }
}
