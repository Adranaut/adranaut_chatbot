document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const chatLog = document.getElementById("chat-log");
  const userInput = document.getElementById("user-input");
  const clearButton = document.getElementById("clear-chat-btn");
  const chatArea = document.querySelector(".chat-area");

  userInput.focus();

  clearButton.addEventListener("click", () => {
    if (confirm("Anda yakin ingin menghapus semua riwayat percakapan?")) {
      localStorage.removeItem("chatHistory");
      location.reload();
    }
  });

  let chatHistory = [];

  function saveHistory() {
    const historyToSave = chatHistory.filter(
      (msg) => msg.role === "user" || msg.role === "model"
    );
    localStorage.setItem("chatHistory", JSON.stringify(historyToSave));
  }

  function loadHistory() {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory && savedHistory.length > 2) {
      chatHistory = JSON.parse(savedHistory);
      chatLog.innerHTML = "";
      chatHistory.forEach((msg) => {
        const roleType = msg.role === "model" ? "bot" : "user";
        appendMessage(msg.parts[0].text, roleType, false, true);
      });
    } else {
      appendMessage(
        "Selamat datang! Percakapan Anda akan disimpan di sini.",
        "system"
      );
    }
  }

  function appendMessage(text, type, isLoading = false, fromHistory = false) {
    const messageWrapper = document.createElement("div");
    messageWrapper.classList.add("message", `${type}-message`);

    if (!fromHistory && !isLoading && type !== "system" && type !== "error") {
      const role = type === "bot" ? "model" : "user";
      chatHistory.push({ role: role, parts: [{ text: text }] });
      saveHistory();
    }

    if (isLoading) {
      messageWrapper.classList.add("loading");
      const p = document.createElement("p");
      p.innerHTML =
        '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
      messageWrapper.appendChild(p);
    } else if (type === "bot") {
      const dirtyHtml = marked.parse(text);
      const cleanHtml = DOMPurify.sanitize(dirtyHtml);
      messageWrapper.innerHTML = cleanHtml;
      addCopyButtons(messageWrapper);
      Prism.highlightAllUnder(messageWrapper);
    } else {
      const p = document.createElement("p");
      p.textContent = text;
      messageWrapper.appendChild(p);
    }

    chatLog.appendChild(messageWrapper);
    chatArea.scrollTop = chatArea.scrollHeight;
    return messageWrapper;
  }

  function addCopyButtons(container) {
    const codeBlocks = container.querySelectorAll(
      'pre code[class*="language-"]'
    );
    codeBlocks.forEach((code) => {
      const pre = code.parentElement;
      if (pre.parentElement.className === "code-block-wrapper") return;

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";
      const language = code.className.replace("language-", "").trim();
      if (language) pre.setAttribute("data-lang", language);

      const copyButton = document.createElement("button");
      copyButton.className = "copy-btn";
      copyButton.textContent = "Copy";
      copyButton.onclick = () => {
        const codeToCopy = pre.querySelector("code").textContent;
        navigator.clipboard.writeText(codeToCopy).then(() => {
          copyButton.textContent = "Copied!";
          setTimeout(() => {
            copyButton.textContent = "Copy";
          }, 2000);
        });
      };

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(copyButton);
      wrapper.appendChild(pre);
    });
  }

  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = `${userInput.scrollHeight}px`;
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const welcomeMessage = document.getElementById("welcome-message");
    if (welcomeMessage) welcomeMessage.remove();

    const messageText = userInput.value.trim();
    if (!messageText) return;

    appendMessage(messageText, "user");
    userInput.value = "";
    userInput.style.height = "";

    const loadingIndicator = appendMessage("", "bot", true);

    try {
      // ===== PERUBAHAN DI SINI =====
      const response = await fetch("/api/chat", {
        // URL diubah ke /api/chat
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });
      // ============================

      chatLog.removeChild(loadingIndicator);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Terjadi kesalahan pada server.");
      }
      const data = await response.json();
      appendMessage(data.response, "bot");
    } catch (error) {
      if (chatLog.contains(loadingIndicator))
        chatLog.removeChild(loadingIndicator);
      appendMessage(`Error: ${error.message}`, "error");
    }
  });

  loadHistory();
});
