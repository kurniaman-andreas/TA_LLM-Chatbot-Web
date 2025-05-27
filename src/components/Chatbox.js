import { useState } from "react";
import { FaCommentDots } from "react-icons/fa";

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const toggleChatbox = () => {
    setIsOpen(!isOpen);
  };

  // const handleSend = async () => {
  //   if (input.trim() === "") return;

  //   // Add the user's message to the chat
  //   setMessages((prev) => [...prev, { text: input, sender: "user" }]);
  //   setInput(""); // Clear the input field
  //   setIsLoading(true); // Set loading state

  //   try {
  //     const response = await fetch("http://localhost:5000/api/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ message: input }),
  //     });

  //     const data = await response.json();

  //     // Add the bot's reply to the chat
  //     setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
  //   } catch (error) {
  //     console.error("Error:", error);
  //     // Handle errors gracefully
  //     setMessages((prev) => [
  //       ...prev,
  //       { text: "Terjadi kesalahan saat memproses pesan.", sender: "bot" },
  //     ]);
  //   } finally {
  //     setIsLoading(false); // Reset loading state
  //   }
  // };

  const handleSend = async () => {
    if (input.trim() === "") return;

    // Add user message
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }), // Menggunakan 'message' sebagai key
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // Menggunakan data.reply sebagai respons
      setMessages((prev) => [...prev, { text: data.reply, sender: "bot" }]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Maaf, terjadi kesalahan. Silakan coba lagi.", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4">
      {/* Chatbox toggle button */}
      <button
        onClick={toggleChatbox}
        className="bg-blue-500 text-white p-4 rounded-full shadow-lg hover:bg-blue-600 transition"
      >
        <FaCommentDots size={24} />
      </button>

      {/* Chatbox container */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-lg border border-gray-200">
          {/* Chatbox header */}
          <div className="p-4 bg-blue-500 text-white rounded-t-lg">
            <h2 className="text-lg font-semibold">Layanan Perlindungan WNI</h2>
          </div>

          {/* Chat messages */}
          <div className="p-4 h-80 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 ${
                  msg.sender === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg max-w-[80%] break-words ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-left">
                <div className="inline-block p-2 rounded-lg bg-gray-200 text-gray-800">
                  Memproses...
                </div>
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="p-4 border-t border-gray-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ketik pesan Anda..."
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-gray-600 bg-gray-100"
              disabled={isLoading} // Disable input while loading
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbox;
