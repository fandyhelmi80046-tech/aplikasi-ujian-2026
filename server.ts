import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Route to generate questions
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { topic, difficulty, count } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key is missing on server" });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Buatlah ${count} buah soal ujian dengan tingkat kesulitan ${difficulty} tentang materi "${topic}".
Soal yang dibuat dapat berupa tipe PILIHAN_GANDA (Pilihan Ganda biasa dengan 4 opsi A, B, C, D) dan ESSAY.
Setiap soal harus relevan, jelas, dan akurat.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Tipe soal, harus 'PILIHAN_GANDA' atau 'ESSAY'",
                },
                questionText: {
                  type: Type.STRING,
                  description: "Isi teks pertanyaan",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Pilihan jawaban (hanya untuk PILIHAN_GANDA)",
                },
                correctAnswerIndex: {
                  type: Type.INTEGER,
                  description: "Indeks jawaban yang benar dari options (0-3) (hanya untuk PILIHAN_GANDA)",
                },
                essayKeyAnswer: {
                  type: Type.STRING,
                  description: "Kunci jawaban / panduan penilaian (hanya untuk ESSAY)",
                },
              },
              required: ["type", "questionText"],
            },
          },
        },
      });

      const textOutput = response.text;
      if (!textOutput) {
        throw new Error("No text output from Gemini");
      }

      const generatedQuestions = JSON.parse(textOutput);
      res.json({ questions: generatedQuestions });
    } catch (error: any) {
      console.error("Error generating questions:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  // GET GitHub Repository Sync Status
  app.get("/api/github/status", async (req, res) => {
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execPromise = promisify(exec);

      const repoPath = "/tmp/smpn5_repo";
      const { stdout: logOut } = await execPromise(`git -C ${repoPath} log -1 --pretty=format:"%h - %s (%cr) <%an>"`);
      const { stdout: statusOut } = await execPromise(`git -C ${repoPath} status -s`);
      const { stdout: branchOut } = await execPromise(`git -C ${repoPath} branch --show-current`);

      res.json({
        success: true,
        repo: "fandyhelmi80046-tech/APLIKASI-UJIAN-DAN-EVALUASI-PEMBELAJARAN",
        branch: branchOut.trim() || "main",
        latestCommit: logOut.trim(),
        hasUncommitted: statusOut.trim().length > 0,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST GitHub Push & Overwrite Online
  app.post("/api/github/push", async (req, res) => {
    try {
      const { token, force = true } = req.body;
      if (!token || typeof token !== "string" || !token.trim()) {
        return res.status(400).json({
          success: false,
          error: "GitHub Personal Access Token (PAT) harus diisi."
        });
      }

      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execPromise = promisify(exec);
      const repoPath = "/tmp/smpn5_repo";

      // 1. Sync latest changes from /app/applet/src and /app/applet/public to /tmp/smpn5_repo
      await execPromise(`cp -rf /app/applet/src/* ${repoPath}/src/`);
      await execPromise(`cp -rf /app/applet/public/assets/* ${repoPath}/public/assets/ 2>/dev/null || true`);
      await execPromise(`cp -f /app/applet/index.html ${repoPath}/index.html 2>/dev/null || true`);
      await execPromise(`cp -f /app/applet/metadata.json ${repoPath}/metadata.json 2>/dev/null || true`);

      // 2. Stage and commit if any new changes
      await execPromise(`git -C ${repoPath} config user.name "fandyhelmi80046-tech"`);
      await execPromise(`git -C ${repoPath} config user.email "fandyhelmi80046@gmail.com"`);
      await execPromise(`git -C ${repoPath} add -A`);
      
      const { stdout: gitStatus } = await execPromise(`git -C ${repoPath} status --porcelain`);
      if (gitStatus.trim().length > 0) {
        await execPromise(`git -C ${repoPath} commit -m "Update UI: Redesign beranda CAT_SMPN5LR, portal login siswa, dan portal login guru"`);
      }

      // 3. Push to GitHub with token
      const cleanToken = token.trim();
      const pushTarget = `https://fandyhelmi80046-tech:${encodeURIComponent(cleanToken)}@github.com/fandyhelmi80046-tech/APLIKASI-UJIAN-DAN-EVALUASI-PEMBELAJARAN.git`;
      
      const forceFlag = force ? "--force" : "";
      const pushCmd = `git -C ${repoPath} push ${pushTarget} main:main ${forceFlag}`;
      const { stdout: pushOut, stderr: pushErr } = await execPromise(pushCmd);

      const { stdout: latestHash } = await execPromise(`git -C ${repoPath} rev-parse --short HEAD`);

      res.json({
        success: true,
        message: "Berhasil di-push dan ditimpa ke repository GitHub!",
        commit: latestHash.trim(),
        output: pushOut || pushErr || "Pushed successfully to main",
        repoUrl: "https://github.com/fandyhelmi80046-tech/APLIKASI-UJIAN-DAN-EVALUASI-PEMBELAJARAN",
        vercelUrl: "https://smpn5lr-five.vercel.app/"
      });
    } catch (err: any) {
      console.error("Push to GitHub failed:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Gagal melakukan git push. Periksa kembali GitHub Token Anda."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
