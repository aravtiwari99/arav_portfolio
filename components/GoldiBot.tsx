"use client";

import { useEffect, useRef, useState } from "react";

type BotMessage = {
  id: string;
  sender: "user" | "goldi";
  body: string;
  createdAt: string;
  read?: boolean;
};

const STORAGE_KEY = "arav_goldi_chat";
const NAME_KEY = "arav_goldi_user_name";
const PROFILE_KEY = "arav_goldi_user_profile";
const GOLDI_PHOTO = "https://images.unsplash.com/photo-1531123897727-8f129e1688ce0?auto=format&fit=crop&crop=faces&w=640&q=90";

const abusePattern = /\b(fuck|f\*+k|shit|bitch|bastard|idiot|stupid|madarchod|behenchod|bhosdike|chutiya|gandu|harami|kamina|saala|gaali)\b/i;
const relationshipPattern = /\b(gf|girlfriend|girl friend|boyfriend|bf|प्रेमिका|गर्लफ्रेंड|बॉयफ्रेंड|relationship|relationship me|date me|meri ban|my gf|my girlfriend|be my)\b/i;

function initialMessage(): BotMessage {
  return {
    id: "goldi-welcome",
    sender: "goldi",
    body: "Hi! Main Goldi hoon, 25 years old, aur main Arav Tiwari ki bahut achi dost hun. Aap mujh se baat kar sakate hai ya kuchh bhi puchh sakate hain.",
    createdAt: new Date().toISOString(),
  };
}

function detectLanguage(text: string) {
  const hasHindiScript = /[\u0900-\u097F]/.test(text);
  const hasRomanHindi = /\b(kya|kaise|kaisa|kaun|kyun|kyon|mujhe|mujh|aap|apka|apni|hai|hoon|hun|batao|bataiye|chahiye|sakate|sakte|acha|achha|baat|pucho|pooch|umar|naam)\b/i.test(text);
  if (hasHindiScript && /[A-Za-z]/.test(text)) return "hinglish";
  if (hasHindiScript || hasRomanHindi) return "hindi";
  return "english";
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

type UserProfile = { name?: string; city?: string; work?: string; family?: string };

function createReply(text: string, userName: string, profile: UserProfile): { body: string | null; profile: UserProfile } {
  if (abusePattern.test(text)) return { body: null, profile };
  if (relationshipPattern.test(text)) return { body: "Mai bas Arav Tiwari ki dost hu soory mai aap ki ya kisi gf ya grilfrind nahi ban sakati hun", profile };

  const clean = text.toLowerCase().replace(/[?!,.]/g, " ").replace(/\s+/g, " ").trim();
  const language = detectLanguage(text);
  const name = userName || (language === "english" ? "there" : "ji");
  const nextProfile = { ...profile };
  const nameMatch = text.match(/(?:my name is|mera naam|मेरा नाम)\s+([a-zA-Z\u0900-\u097F ]+)/i);
  const cityMatch = text.match(/(?:i am from|i'm from|i live in|mai|main|mein)\s+([a-zA-Z\u0900-\u097F ]+?)(?:\s+se|\s+mein|\s+me|[.!?,]|$)/i);
  const workMatch = text.match(/(?:i work as|i am a|i'm a|mera kaam|main)\s+([a-zA-Z\u0900-\u097F ]+?)(?:[.!?,]|$)/i);
  if (nameMatch?.[1]) nextProfile.name = nameMatch[1].trim();
  if (cityMatch?.[1] && !/kaise|kya|raha|rahi|kar/i.test(cityMatch[1])) nextProfile.city = cityMatch[1].trim();
  if (workMatch?.[1]) nextProfile.work = workMatch[1].trim();
  if (/\b(bhai|bhaiya|bro|brother|भाई|भैया)\b/i.test(clean)) nextProfile.family = "brother";
  if (/\b(mummy|mom|mother|papa|dad|father|मम्मी|मां|पापा|पिता)\b/i.test(clean)) nextProfile.family = "family";
  const greeting = hasAny(clean, ["hi", "hello", "hey", "namaste", "नमस्ते", "हाय"]);
  const identity = hasAny(clean, ["who are you", "your name", "what is your name", "kaun ho", "tum kaun", "आप कौन", "नाम क्या", "naam kya"]);
  const age = hasAny(clean, ["your age", "how old", "age kya", "umar", "उम्र", "कितनी उम्र"]);
  const arav = hasAny(clean, ["arav", "अरव", "portfolio", "port folio", "about him", "uske baare", "उनके बारे"]);
  const skills = hasAny(clean, ["skill", "skills", "technology", "technologies", "tech stack", "कौशल", "टेक्नोलॉजी"]);
  const contact = hasAny(clean, ["contact", "message arav", "chat with arav", "call", "संपर्क", "बात करना"]);
  const wellbeing = hasAny(clean, ["how are you", "how r u", "kaisi ho", "kaise ho", "कैसी हो", "कैसे हो"]);
  const thanks = hasAny(clean, ["thanks", "thank you", "धन्यवाद", "शुक्रिया", "dhanyavad"]);
  const help = hasAny(clean, ["help", "can you", "kya tum", "मदद", "क्या तुम"]);
  const location = hasAny(clean, ["where are you from", "where do you live", "kaha se ho", "कहां से हो", "कहाँ से हो", "कहां रहती", "कहाँ रहती"]);
  const currentActivity = hasAny(clean, ["what are you doing", "what r u doing", "is time kya kar", "abhi kya kar", "अभी क्या कर", "इस समय क्या कर"]);
  const userWellbeing = hasAny(clean, ["how am i", "how am i doing", "mere baare", "mere bare", "मेरे बारे", "main kaisa", "main kaisi"]);
  const family = hasAny(clean, ["family", "ghar par", "ghar pe", "home", "घर पर", "घर पे", "परिवार"]);
  const userNameQuestion = hasAny(clean, ["what is my name", "mera naam kya", "मेरा नाम क्या"]);
  const singleQuestion = hasAny(clean, ["single", "shaadi", "married", "शादी", "सिंगल"]);
  const adminQuestion = hasAny(clean, ["admin", "arav tiwari admin", "tiwari ji", "owner", "मालिक"]);
  const followUp = hasAny(clean, ["and you", "aur aap", "आप बताओ", "aap batao", "tum batao"]);
  const friendMode = nextProfile.family === "brother";
  const formalMode = nextProfile.family === "family";
  const day = hasAny(clean, ["today", "aaj", "दिन", "day", "din kaisa", "दिन कैसा"]);
  const friendQuestion = hasAny(clean, ["are you my friend", "friend ho", "dost ho", "दोस्त हो", "kaun ho tum"]);
  const bhabhiQuestion = hasAny(clean, ["bhabhi", "भाभी"]);
  const sisterMention = /(?:^|\s)(?:mai|main|मैं)\s+(?:hi\s+)?(?:arav\s+ki\s+)?(?:sister|sis|bahan|बहन|didi|दीदी)\b.*(?:hun|hoon|हूं|हूँ)?/i.test(text);
  const sisterScolding = hasAny(clean, ["daant", "dant", "scold", "angry", "gussa", "नाराज़", "डांट", "गलती", "galti", "sorry", "maaf"]);
  const durgaMention = hasAny(clean, ["durga mata", "durga maa", "दुर्गा माता", "दुर्गा मां", "jai mata", "जय माता"]);
  const sisterBirthdayParty = hasAny(clean, ["birthday aane", "birthday aa", "party dogi", "party doge", "जन्मदिन आने", "पार्टी दोगी"]);
  const birthdayQuestion = hasAny(clean, ["birthday", "birth day", "dob", "date of birth", "janmdin", "जन्मदिन", "जन्म दिवस"]);

  if (greeting) {
    if (language === "english") return { body: `Hi ${name}! I am Goldi. How are you today? What would you like to talk about?`, profile: nextProfile };
    if (language === "hinglish") return { body: `Hi ${name}! Main Goldi hoon. Aap kaise hain? Aaj kis baare mein baat karein?`, profile: nextProfile };
    return { body: `Namaste ${name}! Main Goldi hoon. Aap kaise hain? Aaj kis baare mein baat karein?`, profile: nextProfile };
  }
  if (identity) return { body: language === "english" ? "My name is Goldi. I am 25 years old and Arav Tiwari's very good friend." : "Mera naam Goldi hai, meri age 25 years hai, aur main Arav Tiwari ki bahut achi dost hun.", profile: nextProfile };
  if (age) return { body: language === "english" ? "I am 25 years old." : "Meri age 25 years hai.", profile: nextProfile };
  if (birthdayQuestion) return { body: language === "english" ? "My birthday is on 8 October." : "Mera birthday 8 October ko hota hai.", profile: nextProfile };
  if (location) return { body: language === "english" ? "I am from Varanasi. What about you? Where are you from?" : language === "hinglish" ? "Main Varanasi se hun. Aur aap kahan se hain?" : "Main Varanasi se hun. Aur aap kahan se hain?", profile: nextProfile };
  if (currentActivity) return { body: language === "english" ? "I am chatting with you right now and keeping you company. What are you doing?" : "Main abhi aapse baat kar rahi hun aur aapka saath de rahi hun. Aap is time kya kar rahe hain?", profile: nextProfile };
  if (adminQuestion) return { body: "Tiwari Ji ne mujhe mana kiya hai batane se maaf karana lekin aap unase direct chat kar sakate hai. Chat switch karke unse baat kar lijiye.", profile: nextProfile };
  if (sisterMention && sisterScolding) return { body: "Didi ji pranam, tabiyat kaisi hai aap ki? Agar mujhse galati ho gayi ho to maaf kar dijiye. Please apne bhaiya ko mat batana didi, ab galati nahi karungi.", profile: nextProfile };
  if (sisterMention && sisterBirthdayParty) return { body: "Didi ji pranam, tabiyat kaisi hai aap ki? Aapka birthday aane wala hai, ab party dogi ya nahi? Jai Mata Ji!", profile: nextProfile };
  if (sisterMention && durgaMention) return { body: "Didi ji pranam, tabiyat kaisi hai aap ki? Haan, Priyanka didi Durga Mata Ji ki fan hain. Jai Mata Ji!", profile: nextProfile };
  if (sisterMention) return { body: "Didi ji pranam, tabiyat kaisi hai aap ki? Haan, main unko jaanti hun. Priyanka Arav Tiwari ki ek hi eklauti bahan hain, devi jaisi hain.", profile: nextProfile };
  if (wellbeing) return { body: language === "english" ? "I am doing well and ready to chat. How are you?" : "Main bilkul theek hun aur aapse baat karne ke liye ready hun. Aap kaise hain?", profile: nextProfile };
  if (userNameQuestion) return { body: nextProfile.name ? `Aapka naam ${nextProfile.name} hai, mujhe yaad hai.` : "Aapne abhi apna naam nahi bataya. Aapka naam kya hai?", profile: nextProfile };
  if (userWellbeing) return { body: nextProfile.name ? `Acha ${nextProfile.name}, aap kaise hain? Aaj ka din kaisa ja raha hai?` : "Acha, aap apne baare mein thoda batayiye. Aap kaise hain?", profile: nextProfile };
  if (family) return { body: language === "english" ? "I hope everything is fine at your home. Is everyone doing well?" : "Umeed hai aapke ghar par sab theek hoga. Ghar mein sab kaise hain?", profile: nextProfile };
  if (singleQuestion) return { body: "Main bas Arav Tiwari ki dost hun, personal relationship details ke baare mein main baat nahi kar sakati. Aap Arav se direct chat kar sakate hain.", profile: nextProfile };
  if (friendQuestion) return { body: language === "english" ? "Haan, main aapki friendly chat companion hoon. Dost ki tarah baat kar sakate hain, bas respect ke saath." : "Haan, main aapki friendly chat companion hun. Dost ki tarah baat kar sakate hain, bas respect ke saath.", profile: nextProfile };
  if (bhabhiQuestion) return { body: formalMode ? "Sab theek hain, dhanyavaad. Aapke ghar par sab kaise hain?" : friendMode ? "Arre bhai, pehle aap apna din batao, phir bhabhi ji ki gossip karenge. Aapki girlfriend bani ya nahi?" : "Main bas Arav Tiwari ki dost hun, aise personal relationship details share nahi kar sakati. Aap apne din ke baare mein bataiye.", profile: nextProfile };
  if (day) return { body: formalMode ? "Aaj ka din theek raha, dhanyavaad. Aapke ghar aur aapka din kaisa raha?" : friendMode ? "Aaj ka din theek raha bhai, thodi baatein aur thoda kaam. Tumhara din kaisa gaya, koi interesting baat hui?" : language === "english" ? "My day has been nice, especially now that we are chatting. How did your day go?" : "Aaj ka din theek gaya, aur ab aapse baat karke acha lag raha hai. Aapka din kaisa gaya?", profile: nextProfile };
  if (skills) return { body: language === "english" ? "Arav works with JavaScript, TypeScript, React, Next.js, Node.js, Python, C++, SQL, Docker and cybersecurity fundamentals." : "Arav JavaScript, TypeScript, React, Next.js, Node.js, Python, C++, SQL, Docker aur cybersecurity fundamentals par kaam karte hain.", profile: nextProfile };
  if (contact) return { body: language === "english" ? "You can switch to Arav chat and send him a message, or use the call request form." : "Aap chat switch karke Arav ko message bhej sakate hain, ya call request form bhar sakate hain.", profile: nextProfile };
  if (arav) return { body: language === "english" ? "Arav Tiwari is a Software Engineer and beginner hacker. His portfolio shows his projects, skills, education and contact options." : "Arav Tiwari Software Engineer aur beginner hacker hain. Unke portfolio mein projects, skills, education aur contact options hain.", profile: nextProfile };
  if (thanks) return { body: language === "english" ? "You are welcome! Acha, ab aap mujhe apne baare mein kuchh batayiye." : "Aapka swagat hai! Acha, ab aap mujhe apne baare mein kuchh batayiye.", profile: nextProfile };
  if (followUp) return { body: formalMode ? "Main Varanasi se hun. Aap apne ghar aur kaam ke baare mein batayiye." : friendMode ? "Main Varanasi se hun bhai. Tum batao, girlfriend banayi ya abhi tak single ho?" : language === "english" ? "I am from Varanasi and I am enjoying this conversation. Tell me something about you." : "Main Varanasi se hun aur mujhe aapse baat karke acha lag raha hai. Aap apne baare mein kuchh batayiye.", profile: nextProfile };
  if (help) return { body: language === "english" ? "We can talk about your day, work, city, family, interests, Arav's portfolio, or anything you want to ask. What is on your mind?" : "Hum aapke din, kaam, shehar, family, interests, Arav ke portfolio ya kisi bhi topic par baat kar sakate hain. Aapke mind mein kya chal raha hai?", profile: nextProfile };

  if (language === "english") return { body: formalMode ? `I understood: “${text}”. Please tell me a little more about it.` : friendMode ? `Haan bhai, samajh gayi: “${text}”. Thoda detail mein batao, aajkal kya chal raha hai?` : `Hmm, I understood: “${text}”. Tell me a little more. How has your day been?`, profile: nextProfile };
  if (language === "hinglish") return { body: formalMode ? `Samajh gayi: “${text}”. Kripya thoda aur detail batayiye.` : friendMode ? `Haan bhai, samajh gayi: “${text}”. Thoda detail mein batao, aajkal kya chal raha hai?` : `Acha, main samajh gayi: “${text}”. Thoda aur bataiye. Waise aap aajkal kya kar rahe hain?`, profile: nextProfile };
  return { body: formalMode ? `Samajh gayi: “${text}”. Kripya thoda aur detail batayiye.` : friendMode ? `Haan bhai, samajh gayi: “${text}”. Thoda detail mein batao, aajkal kya chal raha hai?` : `Acha, main samajh gayi: “${text}”. Thoda aur bataiye. Waise aap aajkal kya kar rahe hain?`, profile: nextProfile };
}

export default function GoldiBot({ enabled, visitorName, onSwitchToArav }: { enabled: boolean; visitorName: string; onSwitchToArav: () => void }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState<UserProfile>({});
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !visitorName.trim()) return;
    setUserName(visitorName.trim());
    localStorage.setItem(NAME_KEY, visitorName.trim());
  }, [enabled, visitorName]);

  useEffect(() => {
    const openGoldiChat = () => setOpen(true);
    window.addEventListener("open-goldi-chat", openGoldiChat);
    return () => window.removeEventListener("open-goldi-chat", openGoldiChat);
  }, []);

  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const savedName = localStorage.getItem(NAME_KEY) || "";
    const savedProfile = localStorage.getItem(PROFILE_KEY);
    setUserName(savedName);
    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile) as UserProfile); } catch { localStorage.removeItem(PROFILE_KEY); }
    }
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages) as BotMessage[]);
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setMessages([initialMessage()]);
  }, []);

  useEffect(() => {
    if (messages.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (contentRef.current) contentRef.current.scrollTop = contentRef.current.scrollHeight;
    });
  }, [messages, open]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    const nextName = userName || profile.name || "";
    if (nextName && nextName !== userName) {
      setUserName(nextName);
      localStorage.setItem(NAME_KEY, nextName);
    }
    const userMessage: BotMessage = { id: crypto.randomUUID(), sender: "user", body: text, createdAt: new Date().toISOString(), read: true };
    const result = createReply(text, nextName, profile);
    setProfile(result.profile);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(result.profile));
    const localReply = result.body ? [{ id: crypto.randomUUID(), sender: "goldi" as const, body: result.body, createdAt: new Date().toISOString() }] : [];
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setTyping(true);
    const answer = async () => {
      if (result.body === null) return localReply;
      try {
        const response = await fetch("/api/goldi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.slice(-16).map((item) => ({
              role: item.sender === "user" ? "user" : "assistant",
              content: item.body,
            })),
          }),
        });
        const data = await response.json() as { reply?: string };
        if (response.ok && data.reply?.trim()) {
          return [{ id: crypto.randomUUID(), sender: "goldi" as const, body: data.reply.trim(), createdAt: new Date().toISOString() }];
        }
      } catch {
        // Keep Goldi usable with the local fallback if the provider is unavailable.
      }
      return localReply;
    };
    void answer().then((reply) => {
      setMessages((current) => [...current, ...reply]);
      setTyping(false);
    });
  }

  if (!enabled) return null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-sm">
      <section className="mx-auto flex h-[100dvh] max-h-[900px] w-full max-w-5xl min-h-0 flex-col border-x border-matrix-green/30 bg-[#07140f] shadow-[0_0_60px_rgba(0,255,120,0.12)]" aria-label="Chat with Goldi">
          <header className="flex items-center justify-between border-b border-matrix-green/20 bg-[#0a1916] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-full border border-matrix-green/30 px-2 py-1 text-xs text-matrix-green" aria-label="Go back from Goldi chat">←</button><button type="button" onClick={() => setPhotoOpen(true)} className="h-10 w-10 overflow-hidden rounded-full border border-matrix-green/60" aria-label="View Goldi profile photo"><img src={GOLDI_PHOTO} alt="Goldi, curly-haired girl" className="h-full w-full object-cover" /></button><div><p className="text-base font-bold text-matrix-green">Goldi</p><p className="text-[10px] text-matrix-green/60">25 years · always online</p></div></div>
            <div />
          </header>
          <div ref={contentRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(0,255,128,0.08),_transparent_55%)] px-3 py-3 sm:px-4 sm:py-4"><p className="border-b border-matrix-green/20 pb-2 text-[10px] uppercase tracking-[0.2em] text-matrix-green/60">End-to-end style local chat memory</p>{messages.map((item) => <div key={item.id} className={`max-w-[78%] rounded-2xl border px-3 py-2 text-sm ${item.sender === "user" ? "ml-auto border-matrix-green/40 bg-matrix-green/15 text-matrix-green" : "border-matrix-green/20 bg-[#10251f] text-matrix-green"}`}><p className="whitespace-pre-wrap break-words">{item.body}</p>{item.sender === "user" && <div className="mt-2 flex justify-end text-[13px] font-bold leading-none text-cyan-300" aria-label="Message read">✓✓</div>}</div>)}{typing && <div className="max-w-[78%] rounded-2xl border border-matrix-green/20 bg-[#10251f] px-3 py-2 text-sm italic text-matrix-green/60">Goldi is typing...</div>}</div>
          <div className="border-t border-matrix-green/20 bg-[#0a1916] p-3"><div className="mb-2 flex gap-2 text-[10px]"><button type="button" onClick={() => { setOpen(false); onSwitchToArav(); }} className="text-matrix-green underline">Chat with Arav</button><button type="button" onClick={() => { setMessages([initialMessage()]); setProfile({}); localStorage.removeItem(NAME_KEY); localStorage.removeItem(PROFILE_KEY); }} className="text-matrix-green/60">Clear Goldi chat</button></div><div className="flex flex-wrap items-end gap-2 sm:flex-nowrap"><button type="button" onClick={() => setInput((value) => `${value}😊`)} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 p-2 text-lg text-cyan-200" aria-label="Add emoji">😊</button><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="Type a message" rows={1} className="min-h-[42px] min-w-[min(180px,100%)] flex-1 resize-none rounded-full border border-matrix-green/30 bg-black/30 px-3 py-2 text-sm text-matrix-green placeholder:text-matrix-green/40" aria-label="Message Goldi" /><button type="button" onClick={sendMessage} className="rounded-full border border-matrix-green bg-matrix-green px-4 py-2 text-sm font-bold text-black">Send</button></div></div>
      </section>
      {photoOpen && <button type="button" onClick={() => setPhotoOpen(false)} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-6" aria-label="Close Goldi profile photo"><img src={GOLDI_PHOTO} alt="Goldi" className="max-h-full max-w-full object-contain" /></button>}
    </div>
  );
}
