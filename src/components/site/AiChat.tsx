import { CONTACT_EMAIL, CONTACT_PHONE } from "@/config";
import { useState } from "react";
import { MessageCircle, X, Bot, Mail, MessageSquare } from "lucide-react";

export function AiChat() {
  const [open, setOpen] = useState(false);

  const whatsappUrl = `https://wa.me/91${CONTACT_PHONE.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi! I have a question about Cambay Crystal products. 💎"
  )}`;
  const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Enquiry – Cambay Crystal"
  )}&body=${encodeURIComponent("Hi,\n\nI would like to know more about your products.\n\nThank you!")}`;

  return (
    <>
      {/* Contact popup */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-80 transition-all duration-300 origin-bottom-right ${
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-90 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between flex-shrink-0"
            style={{ backgroundColor: "#3F5C45", color: "#FFFFFF" }}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <div>
                <p className="font-semibold text-sm leading-none">Cambay Crystal</p>
                <p className="text-[10px] opacity-80 mt-0.5">We're here to help 💎</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-full transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Offline notice */}
            <div
              className="rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={{ backgroundColor: "#EFE8DC", color: "#2E2B26" }}
            >
              <p className="font-semibold mb-1">🤖 AI chat is currently offline</p>
              <p className="opacity-80 text-xs">
                Our assistant is temporarily unavailable. Reach us directly — we'd love to help!
              </p>
            </div>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat on WhatsApp"
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: "#25D366", color: "#FFFFFF" }}
            >
              <MessageSquare className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold leading-none">Chat on WhatsApp</p>
                <p className="text-[11px] opacity-80 mt-0.5">+91 {CONTACT_PHONE}</p>
              </div>
            </a>

            {/* Email */}
            <a
              href={mailtoUrl}
              aria-label="Send us an email"
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 active:opacity-75"
              style={{ backgroundColor: "#3F5C45", color: "#FFFFFF" }}
            >
              <Mail className="h-5 w-5 flex-shrink-0" />
              <div className="text-left">
                <p className="font-semibold leading-none">Send us an Email</p>
                <p className="text-[11px] opacity-80 mt-0.5">{CONTACT_EMAIL}</p>
              </div>
            </a>

            <p className="text-center text-[10px] text-muted-foreground pt-1">
              Typically reply within a few hours
            </p>
          </div>
        </div>
      </div>

      {/* FAB button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open contact options"
        className="fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
        style={{ backgroundColor: "#3F5C45", color: "#FFFFFF" }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#56785D")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#3F5C45")}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  );
}
