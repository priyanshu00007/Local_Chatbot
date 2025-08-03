"use client";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  Send, Bot, User, Clock, Trash2, Paperclip, X,
  FileText, Image, File, Download, Copy
} from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';

// Placeholder Shadcn-like components (self-contained)
const Button = ({ children, onClick, disabled, variant = "default", className = "", type = "button" }) => {
  let baseClasses = "px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200";
  let variantClasses = "";
  if (variant === "default") {
    variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "destructive") {
    variantClasses = "bg-red-600 text-white hover:bg-red-700";
  } else if (variant === "outline") {
    variantClasses = "bg-white text-gray-900 border border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:hover:bg-gray-700";
  } else if (variant === "ghost") {
    variantClasses = "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700";
  }
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${disabledClasses} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const Textarea = React.forwardRef(({ value, onChange, onKeyDown, placeholder, disabled, rows, className = "" }, ref) => (
  <textarea
    ref={ref}
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    placeholder={placeholder}
    disabled={disabled}
    rows={rows}
    className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
  />
));
Textarea.displayName = "Textarea";

const ThemeButton = () => {
  const [theme, setTheme] = useState('light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const toggleTheme = useCallback(() => setTheme(prev => prev === 'light' ? 'dark' : 'light'), []);
  return (
    <Button variant="outline" size="sm" onClick={toggleTheme} className="p-2">
      {theme === 'light' ? 'Dark' : 'Light'}
    </Button>
  );
};

const MODELS = [
  { id: "llama3.2:latest", name: "Llama 3.2 Latest (Local)", description: "Most capable local model", type: "ollama" },
  { id: "deepseek-r1:1.5b", name: "DeepSeek R1 1.5B (Local)", description: "Fast and efficient local model", type: "ollama" },
  { id: "smollm:135m", name: "SmolLM 135M (Local)", description: "Lightweight local model", type: "ollama" },
  { id: "gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash (API)", description: "Google's fast, multi-modal model", type: "gemini" },
];

// Helper to read PDF content
async function readPdfFileContent(file) {
  const typedarray = new Uint8Array(await file.arrayBuffer());
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
  const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
  let text = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    content.items.forEach((item) => { text += item.str + " "; });
  }
  return text;
}

// Helper to read image as base64 (without prefix)
async function readImageFileContent(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Exponential backoff fetch
async function fetchWithExponentialBackoff(url, options, maxRetries = 5, retryDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { ...options, signal: options.signal });
      if (response.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
        continue;
      }
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, i)));
    }
  }
}

// Custom CodeBlock
const CodeBlock = ({ children, language }) => {
  const codeRef = useRef(null);
  const handleCopy = useCallback(() => {
    if (codeRef.current) {
      navigator.clipboard.writeText(codeRef.current.innerText)
        .then(() => alert('Code copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  }, []);

  return (
    <div className="relative my-4 rounded-lg bg-gray-900 p-4 font-mono text-sm text-white">
      <div className="absolute right-2 top-2 flex items-center gap-2">
        <span className="rounded-md bg-gray-700 px-2 py-1 text-xs text-gray-300">{language || 'text'}</span>
        <Button variant="ghost" onClick={handleCopy} className="p-1 text-gray-300 hover:bg-gray-700">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <pre className="overflow-x-auto pr-16 text-xs">
        <code ref={codeRef} className={`language-${language}`}>
          {children}
        </code>
      </pre>
    </div>
  );
};

// Markdown Renderer
const MarkdownRenderer = React.memo(({ content }) => {
  const components = useMemo(() => ({
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>
      ) : (
        <code className={className} {...props}>{children}</code>
      );
    },
    p: (props) => <p className="mb-2 last:mb-0" {...props} />,
    ul: (props) => <ul className="list-disc list-inside mb-2" {...props} />,
    ol: (props) => <ol className="list-decimal list-inside mb-2" {...props} />,
    li: (props) => <li className="mb-1" {...props} />,
    h1: (props) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
    h2: (props) => <h2 className="text-xl font-bold mt-4 mb-2" {...props} />,
    h3: (props) => <h3 className="text-lg font-bold mt-3 mb-1" {...props} />,
    blockquote: (props) => <blockquote className="border-l-4 border-gray-400 pl-4 italic my-2" {...props} />,
    a: (props) => <a className="text-blue-500 hover:underline" {...props} />,
    table: (props) => <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600 my-2" {...props} />,
    thead: (props) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
    th: (props) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400" {...props} />,
    tbody: (props) => <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700" {...props} />,
    tr: (props) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800" {...props} />,
    td: (props) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200" {...props} />,
  }), []);

  return <ReactMarkdown components={components}>{content}</ReactMarkdown>;
});

// Main Component
export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3.2:latest");
  const [attachedFiles, setAttachedFiles] = useState([]);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversations, scrollToBottom]);

  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      content: null,
    }));

    setAttachedFiles(prev => [...prev, ...newFiles]);

    for (const fileObj of newFiles) {
      try {
        let content;
        if (fileObj.type === "application/pdf" || fileObj.name.endsWith('.pdf')) {
          content = await readPdfFileContent(fileObj.file);
        } else if (fileObj.type.startsWith('image/')) {
          content = await readImageFileContent(fileObj.file);
        } else if (['text/', '.md', '.txt', '.json', '.csv'].some(ext => fileObj.type.startsWith(ext) || fileObj.name.endsWith(ext))) {
          content = await fileObj.file.text();
        }
        setAttachedFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, content } : f));
      } catch (error) {
        console.error("Error reading file:", fileObj.name, error);
        setAttachedFiles(prev => prev.filter(f => f.id !== fileObj.id));
      }
    }
  }, []);

  const removeFile = useCallback((fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const getFileIcon = useCallback((type) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type === "application/pdf" || type.endsWith('.pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const createGeminiPayload = useCallback((userPrompt, files) => {
    const parts = [{ text: userPrompt }];
    files.forEach(file => {
      if (file.type.startsWith('image/') && file.content) {
        parts.push({ inlineData: { mimeType: file.type, data: file.content } });
      } else if (file.content) {
        parts.push({ text: `Content of ${file.name}:\n\n${file.content}` });
      }
    });
    return { contents: [{ role: "user", parts }] };
  }, []);

  const createOllamaPayload = useCallback((userPrompt, files) => {
    let combinedPrompt = userPrompt;
    files.forEach(file => {
      if (file.content) combinedPrompt += `\n\nContent of ${file.name}:\n\n${file.content}`;
    });
    return { model: selectedModel, prompt: combinedPrompt, stream: false };
  }, [selectedModel]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (prompt.trim().length < 3 && attachedFiles.length === 0) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: prompt.trim(),
      files: attachedFiles,
      timestamp: new Date().toLocaleTimeString(),
      model: selectedModel,
    };

    setConversations(prev => [...prev, userMessage]);
    setPrompt("");
    setAttachedFiles([]);
    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      content: "",
      timestamp: new Date().toLocaleTimeString(),
      runtime: null,
      model: selectedModel,
    };

    setConversations(prev => [...prev, botMessage]);

    try {
      const startTime = performance.now();
      const currentModel = MODELS.find(m => m.id === selectedModel);
      let fullResponseContent = "";

      if (currentModel.type === "gemini") {
        const payload = createGeminiPayload(prompt, attachedFiles);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Gemini API key is not set.");
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const response = await fetchWithExponentialBackoff(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        fullResponseContent = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else if (currentModel.type === "ollama") {
        const payload = createOllamaPayload(prompt, attachedFiles);
        const ollamaApiUrl = "http://localhost:11434/api/generate";

        const response = await fetchWithExponentialBackoff(ollamaApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal,
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const ollamaResponse = await response.json();
        fullResponseContent = ollamaResponse.response;
      } else {
        throw new Error("Invalid model type selected.");
      }

      const endTime = performance.now();
      const runtime = endTime - startTime;

      setConversations(prev =>
        prev.map(msg => msg.id === botMessage.id ? { ...msg, content: fullResponseContent, runtime } : msg)
      );
    } catch (error) {
      if (error.name === "AbortError") {
        setConversations(prev => prev.filter(msg => msg.id !== botMessage.id));
      } else {
        console.error("Error:", error);
        setConversations(prev =>
          prev.map(msg =>
            msg.id === botMessage.id
              ? { ...msg, content: `Error: ${error.message || "An error occurred."}`, isError: true }
              : msg
          )
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [prompt, attachedFiles, selectedModel, createGeminiPayload, createOllamaPayload]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearConversation = useCallback(() => {
    setConversations([]);
    setAttachedFiles([]);
  }, []);

  const exportConversation = useCallback(() => {
    const exportData = { timestamp: new Date().toISOString(), model: selectedModel, conversations };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedModel, conversations]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const currentModelInfo = useMemo(() => MODELS.find(m => m.id === selectedModel), [selectedModel]);

  // Extracted Message Component
  const Message = ({ message }) => (
    <div className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.type === 'bot' && (
        <div className="h-fit flex-shrink-0 rounded-full bg-blue-100 p-2 dark:bg-blue-900">
          <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      <Card className={`max-w-[80%] p-4 ${
        message.type === 'user'
          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-800'
          : message.isError
          ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
          : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}>
        {message.type === 'user' ? (
          <>
            {message.content && <p className="mb-2 whitespace-pre-wrap">{message.content}</p>}
            {message.files?.length > 0 && (
              <div className="space-y-2">
                {message.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 rounded-md bg-white/20 p-2">
                    {getFileIcon(file.type)}
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs opacity-70">({formatFileSize(file.size)})</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {message.content ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <MarkdownRenderer content={message.content} />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.1s' }} />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
              </div>
            )}
            {message.runtime && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>{message.runtime.toFixed(2)}ms</span>
              </div>
            )}
          </>
        )}
        <div className="mt-2 text-xs opacity-60">{message.timestamp}</div>
      </Card>
      {message.type === 'user' && (
        <div className="h-fit flex-shrink-0 rounded-full bg-blue-600 p-2">
          <User className="h-5 w-5 text-white" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
            <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-blue-500">AI Assistant</h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentModelInfo?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearConversation} disabled={conversations.length === 0}>
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={exportConversation} disabled={conversations.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
          <ThemeButton />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-blue-100 p-4 dark:bg-blue-900">
              <Bot className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">Welcome to AI Assistant</h2>
            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-4">
              Start a conversation by typing a message below. You can also upload files to analyze or discuss their content!
            </p>
          </div>
        ) : (
          conversations.map((message) => <Message key={message.id} message={message} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      {attachedFiles.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-4xl">
            <h4 className="mb-2 text-sm font-medium">Attached Files ({attachedFiles.length})</h4>
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file) => (
                <div key={file.id} className="flex items-center gap-2 rounded-md border bg-white p-2 dark:bg-gray-700">
                  {getFileIcon(file.type)}
                  <span className="text-sm">{file.name}</span>
                  <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
                  <Button variant="ghost" onClick={() => removeFile(file.id)} className="h-auto p-1">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="relative flex gap-2">
            <Textarea
              className="min-h-[44px] max-h-[120px] flex-1 resize-none border-gray-300 pr-12 focus:border-blue-500 dark:border-gray-600 dark:focus:border-blue-400"
              placeholder="Type your message here..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
            />
            <Button
              type="button"
              variant="ghost"
              className="absolute right-14 top-2 h-auto p-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            {isLoading ? (
              <Button
                type="button"
                variant="destructive"
                className="flex min-w-[44px] items-center justify-center px-4 py-2"
                onClick={handleStop}
              >
                <X className="h-5 w-5" />
                <span className="ml-2 text-sm">Stop</span>
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={prompt.trim().length < 3 && attachedFiles.length === 0}
                className="min-w-[44px] px-4 py-2"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <label htmlFor="model-select" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Model
            </label>
            <select
              id="model-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="rounded border border-gray-300 bg-white px-3 py-1 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              style={{ minWidth: 200, maxWidth: 240 }}
            >
              {MODELS.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentModelInfo?.description}
            </span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.md,.json,.csv,.pdf,image/*"
          />
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Press Enter to send • Shift + Enter for new line • Click <Paperclip className="inline-block h-3 w-3" /> to attach files
          </p>
        </form>
      </div>
    </div>
  );
}
