import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { ChatOllama } from "@langchain/ollama";

// 🔹 Memuat FAISS index
let vectorStorePromise = (async () => {
  try {
    const embeddings = new OllamaEmbeddings({ model: "deepseek-r1:1.5b" });
    const store = await FaissStore.loadFromPython("./faiss_index", embeddings);
    console.log("✅ FAISS index berhasil dimuat!");
    return store;
  } catch (error) {
    console.error("❌ Gagal memuat FAISS index:", error);
    return null;
  }
})();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { message } = req.body;
      console.log("✅ Pesan yang diterima:", message);

      const vectorStore = await vectorStorePromise;
      if (!vectorStore) {
        throw new Error("FAISS index belum dimuat. Harap periksa file index.");
      }

      const reply = await generateResearchReport(message, vectorStore);
      res.status(200).json({ reply });
    } catch (error) {
      console.error("❌ Error dalam handler:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

async function generateResearchReport(query, vectorStore) {
  // 1. Generating Research Queries
  const researchQuestions = await generateResearchQuestions(query);
  console.log("🔍 Pertanyaan penelitian:", researchQuestions);

  // 2. Retrieving Documents
  const relevantDocs = await retrieveDocuments(researchQuestions, vectorStore);
  console.log("📄 Dokumen yang ditemukan:", relevantDocs.length);

  // 3. Evaluating Relevance
  const filteredDocs = await evaluateRelevance(query, relevantDocs);
  console.log("✅ Dokumen yang relevan:", filteredDocs.length);

  // 4. Summarizing Findings
  const summaries = await summarizeDocuments(filteredDocs);
  console.log("📝 Ringkasan temuan:", summaries);

  // 5. Final Report Generation
  const finalReport = await generateFinalReport(query, summaries);
  return finalReport;
}

async function generateResearchQuestions(query) {
  const llm = new ChatOllama({
    model: "deepseek-r1:1.5b",
    temperature: 0.7, // Mengurangi kreativitas untuk hasil lebih konsisten
  });

  const messages = [
    {
      role: "system",
      content: `Anda adalah asisten penelitian. Buat 3 pertanyaan dalam BAHASA INDONESIA SAJA untuk mencari informasi terkait query pengguna.
      TULISKAN LANGSUNG TANPA FORMAT JSON.
      Contoh output:
      - Apa saja jenis asuransi kesehatan di Singapura?
      - Bagaimana sistem asuransi kesehatan bekerja di Singapura?
      - Siapa yang berhak mendapatkan asuransi kesehatan di Singapura?`,
    },
    { role: "user", content: query },
  ];

  const response = await llm.call(messages);
  const questions = response.content
    .split("\n")
    .filter((line) => line.trim().startsWith("-"))
    .map((line) => line.replace(/^- /, "").trim());

  return questions.length > 0 ? questions : [query];
}

async function retrieveDocuments(questions, vectorStore) {
  let allDocs = [];
  for (const question of questions) {
    const docs = await vectorStore.similaritySearch(question, 3);
    allDocs = [...allDocs, ...docs];
  }
  return allDocs;
}

async function evaluateRelevance(query, docs) {
  const llm = new ChatOllama({ model: "deepseek-r1:1.5b" });

  const filteredDocs = [];
  for (const doc of docs) {
    const messages = [
      {
        role: "system",
        content: `Evaluasi apakah dokumen ini relevan dengan query dalam BAHASA INDONESIA.
        Query: ${query}
        Jawab hanya dengan "YA" atau "TIDAK"`,
      },
      { role: "user", content: doc.pageContent.substring(0, 1000) },
    ];

    const response = await llm.call(messages);
    if (response.content.trim().toUpperCase() === "YA") {
      filteredDocs.push(doc);
    }
  }
  return filteredDocs;
}

async function summarizeDocuments(docs) {
  const llm = new ChatOllama({ model: "deepseek-r1:1.5b" });
  const summaries = [];

  for (const doc of docs) {
    const messages = [
      {
        role: "system",
        content: `Buat ringkasan singkat dalam BAHASA INDONESIA SAJA dari dokumen berikut. 
        Maksimal 3 kalimat. Fokus pada fakta utama.`,
      },
      { role: "user", content: doc.pageContent.substring(0, 2000) },
    ];

    const response = await llm.call(messages);
    summaries.push(response.content);
  }

  return summaries.join("\n\n");
}

async function generateFinalReport(query, summaries) {
  const llm = new ChatOllama({
    model: "deepseek-r1:1.5b",
    temperature: 0.5, // Lebih rendah untuk hasil lebih fokus
  });

  const messages = [
    {
      role: "system",
      content: `Buat laporan dalam BAHASA INDONESIA SAJA dengan format STRUKTUR KETAT:
      
      1. PENDAHULUAN (2-3 kalimat)
      2. TEMUAN UTAMA (poin-poin bullet)
      3. KESIMPULAN (1-2 kalimat)

      TULISKAN LANGSUNG TANPA KOMENTAR.
      GUNAKAN BAHASA FORMAL DAN JELAS.
      HANYA BERDASARKAN DATA YANG DIBERIKAN.`,
    },
    { role: "user", content: `Pertanyaan: ${query}\n\nData: ${summaries}` },
  ];

  const response = await llm.call(messages);
  // Bersihkan output dari tag atau komentar tidak perlu
  return response.content
    .replace(/<think>.*<\/think>/gs, "")
    .replace(/\[.*?\]/g, "")
    .trim();
}

// import { FaissStore } from "@langchain/community/vectorstores/faiss";
// import { OllamaEmbeddings, ChatOllama } from "@langchain/ollama";

// // 🔹 Simpan riwayat percakapan dalam sesi (bisa diganti dengan database untuk skala besar)
// const conversationHistory = {};

// // 🔹 Memuat FAISS index secara asynchronous
// let vectorStorePromise = (async () => {
//   try {
//     const embeddings = new OllamaEmbeddings({ model: "deepseek-r1:1.5b" });
//     const store = await FaissStore.loadFromPython("./faiss_index", embeddings);
//     console.log("✅ FAISS index berhasil dimuat!");
//     return store;
//   } catch (error) {
//     console.error("❌ Gagal memuat FAISS index:", error);
//     return null;
//   }
// })();

// export default async function handler(req, res) {
//   if (req.method === "POST") {
//     try {
//       const { message, sessionId } = req.body;
//       console.log("✅ Pesan diterima:", message);

//       if (!sessionId) {
//         return res.status(400).json({ error: "sessionId diperlukan!" });
//       }

//       // 🔹 Pastikan FAISS index sudah dimuat
//       const vectorStore = await vectorStorePromise;
//       if (!vectorStore) {
//         throw new Error("FAISS index belum dimuat. Harap periksa file index.");
//       }

//       // 🔹 Ambil ingatan percakapan sebelumnya
//       if (!conversationHistory[sessionId]) {
//         conversationHistory[sessionId] = [];
//       }

//       // 🔹 Proses pesan dengan Retrieval-Augmented Generation (RAG)
//       const reply = await processMessageWithRAG(
//         message,
//         vectorStore,
//         sessionId
//       );
//       console.log("✅ Jawaban chatbot:", reply);

//       res.status(200).json({ reply });
//     } catch (error) {
//       console.error("❌ Error dalam handler:", error);
//       res.status(500).json({ error: error.message });
//     }
//   } else {
//     res.status(405).json({ message: "Method not allowed" });
//   }
// }

// async function processMessageWithRAG(message, vectorStore, sessionId) {
//   console.log("🔹 Mencari dokumen yang relevan...");
//   const relevantDocs = await vectorStore.similaritySearch(message, 2);
//   const context = relevantDocs.map((doc) => doc.pageContent).join("\n");

//   // 🔹 Simpan riwayat percakapan untuk sesi tertentu
//   const chatHistory = conversationHistory[sessionId];

//   const llm = new ChatOllama({ model: "deepseek-r1:1.5b" });

//   // 🔹 Format pesan agar chatbot lebih natural
//   const messages = [
//     {
//       role: "system",
//       content:
//         "Anda adalah chatbot layanan WNI yang ramah dan informatif dalam bahasa Indonesia.",
//     },
//     ...chatHistory, // 🔹 Masukkan percakapan sebelumnya
//     { role: "user", content: `Konteks: ${context}\n\nUser: ${message}` },
//   ];

//   try {
//     console.log("🔹 Memanggil model Ollama...");
//     const reply = await llm.call(messages);
//     const replyContent = reply.content;

//     // 🔹 Simpan respons ke dalam riwayat percakapan
//     chatHistory.push({ role: "user", content: message });
//     chatHistory.push({ role: "assistant", content: replyContent });

//     return replyContent;
//   } catch (error) {
//     console.error("❌ Error saat memanggil model Ollama:", error);
//     throw new Error("Gagal memproses jawaban dari model.");
//   }
// }
