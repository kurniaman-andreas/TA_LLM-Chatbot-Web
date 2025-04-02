// import { FaissStore } from "@langchain/community/vectorstores/faiss";
// import { OllamaEmbeddings } from "@langchain/ollama";
// import { OllamaLLM } from "@langchain/ollama";

// // 🔹 Memuat FAISS index secara asynchronous
// let vectorStorePromise = (async () => {
//   try {
//     const embeddings = new OllamaEmbeddings({ model: "deepseek-r1:1.5b" });
//     const store = await FaissStore.loadFromPython("./faiss_index", embeddings);
//     console.log("✅ FAISS index berhasil dimuat!");
//     return store;
//   } catch (error) {
//     console.error("❌ Gagal memuat FAISS index:", error);
//     return null; // Return null jika gagal memuat FAISS
//   }
// })();

// export default async function handler(req, res) {
//   if (req.method === "POST") {
//     try {
//       const { message } = req.body;
//       console.log("✅ Pesan yang diterima:", message); // 🔹 Log pesan input

//       // 🔹 Pastikan FAISS index telah dimuat
//       const vectorStore = await vectorStorePromise;
//       if (!vectorStore) {
//         console.error("❌ FAISS index belum dimuat!");
//         throw new Error("FAISS index belum dimuat. Harap periksa file index.");
//       }
//       console.log("✅ FAISS index berhasil dimuat.");

//       // 🔹 Proses pesan dengan Retrieval-Augmented Generation (RAG)
//       const reply = await processMessageWithRAG(message, vectorStore);
//       console.log("✅ Jawaban yang dihasilkan:", reply); // 🔹 Log jawaban output

//       res.status(200).json({ reply });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   } else {
//     res.status(405).json({ message: "Method not allowed" });
//   }
// }

// async function processMessageWithRAG(message, vectorStore) {
//   console.log("🔹 Mencari dokumen yang relevan...");
//   const relevantDocs = await vectorStore.similaritySearch(message, 2);
//   console.log("✅ Dokumen ditemukan:", relevantDocs);

//   const context = relevantDocs.map((doc) => doc.pageContent).join("\n");
//   console.log("✅ Konteks yang digunakan:", context);

//   const llm = new OllamaLLM({ model: "deepseek-r1:1.5b" });
//   const prompt = `Anda adalah asisten yang membantu menjawab pertanyaan tentang pelayanan perlindungan WNI. Gunakan informasi berikut untuk menjawab pertanyaan:
//   ${context}

//   Pertanyaan: ${message}
//   Jawaban:`;

//   console.log("✅ Prompt yang dikirim ke LLM:\n", prompt);

//   try {
//     console.log("🔹 Memanggil model Ollama...");
//     const reply = await llm.generate(prompt);
//     console.log("✅ Jawaban dari model:", reply);
//     return reply;
//   } catch (error) {
//     console.error("❌ Error saat memanggil model Ollama:", error);
//     throw new Error("Gagal memproses jawaban dari model.");
//   }
// }

import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OllamaEmbeddings } from "@langchain/ollama";
import { ChatOllama } from "@langchain/ollama";

// 🔹 Memuat FAISS index secara asynchronous
let vectorStorePromise = (async () => {
  try {
    const embeddings = new OllamaEmbeddings({ model: "deepseek-r1:1.5b" });
    const store = await FaissStore.loadFromPython("./faiss_index", embeddings);
    console.log("✅ FAISS index berhasil dimuat!");
    return store;
  } catch (error) {
    console.error("❌ Gagal memuat FAISS index:", error);
    return null; // Return null jika gagal memuat FAISS
  }
})();

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { message } = req.body;
      console.log("✅ Pesan yang diterima:", message); // 🔹 Log pesan input

      // 🔹 Pastikan FAISS index telah dimuat
      const vectorStore = await vectorStorePromise;
      if (!vectorStore) {
        console.error("❌ FAISS index belum dimuat!");
        throw new Error("FAISS index belum dimuat. Harap periksa file index.");
      }
      console.log("✅ FAISS index berhasil dimuat.");

      // 🔹 Proses pesan dengan Retrieval-Augmented Generation (RAG)
      const reply = await processMessageWithRAG(message, vectorStore);
      console.log("✅ Jawaban yang dihasilkan:", reply); // 🔹 Log jawaban output

      res.status(200).json({ reply });
    } catch (error) {
      console.error("❌ Error dalam handler:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

async function processMessageWithRAG(message, vectorStore) {
  console.log("🔹 Mencari dokumen yang relevan...");
  const relevantDocs = await vectorStore.similaritySearch(message, 2);
  console.log("✅ Dokumen ditemukan:", relevantDocs);

  const context = relevantDocs.map((doc) => doc.pageContent).join("\n");
  console.log("✅ Konteks yang digunakan:", context);

  const llm = new ChatOllama({ model: "deepseek-r1:1.5b" });

  // Format the input as an array of messages
  const messages = [
    {
      role: "system",
      content:
        "Anda adalah asisten layanan yang memberikan jawaban tentang layanan WNI tanpa menampilkan proses berpikir. Jawablah dengan jelas dan ringkas dan dalam bahasa Indonesia:",
    },
    {
      role: "user",
      content: `${context}\n\nPertanyaan: ${message}\nJawaban:`,
    },
  ];

  console.log("✅ Messages yang dikirim ke LLM:\n", messages);

  try {
    console.log("🔹 Memanggil model Ollama...");
    const reply = await llm.call(messages); // Pass the formatted messages
    console.log("✅ Jawaban dari model:", reply);

    // Extract the content from the AIMessage object
    const replyContent = reply.content;
    console.log("✅ Extracted reply content:", replyContent);

    return replyContent; // Return only the content (a string)
  } catch (error) {
    console.error("❌ Error saat memanggil model Ollama:", error);
    throw new Error("Gagal memproses jawaban dari model.");
  }
}
