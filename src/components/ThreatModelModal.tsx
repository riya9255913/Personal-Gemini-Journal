import React from "react";
import { ShieldCheck, X, CheckCircle2, Lock, FileCode, AlertTriangle, Key, Database, RefreshCcw } from "lucide-react";

interface ThreatModelModalProps {
  onClose: () => void;
}

export const ThreatModelModal: React.FC<ThreatModelModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-stone-900">
                Agentic Threat Model & Security Review
              </h2>
              <p className="text-xs text-stone-500">
                Adhering to OWASP Top 10 Web & LLM Standards across the 5 Threat Zones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Executive Security Status */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <p className="font-semibold text-sm text-emerald-900">
                Security Posture: Production Certified
              </p>
              <p>
                Zero-hardcoded secrets, owner-bound data isolation, server-side `@google/genai` proxying with automated fallback ladder, and strict indirect prompt injection defenses.
              </p>
            </div>
          </div>

          {/* Section 1: Threat Summary Table across the 5 Threat Zones */}
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              1. The 5 Threat Zones: Matrix & Countermeasures
            </h3>
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-stone-50 text-stone-700 border-b border-stone-200">
                  <tr>
                    <th className="p-3 font-semibold">Threat Zone</th>
                    <th className="p-3 font-semibold">Identified Risk Scenario</th>
                    <th className="p-3 font-semibold">Enforced Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-600">
                  <tr>
                    <td className="p-3 font-medium text-stone-900 bg-stone-50/30">
                      1. Input Surfaces
                    </td>
                    <td className="p-3">
                      Malicious or oversized payloads, prototype pollution, cross-site scripting (OWASP A03 / LLM02).
                    </td>
                    <td className="p-3 text-emerald-800">
                      Top-level request body parsing with 2MB limits; strict string sanitization; character caps; safe rendering.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-stone-900 bg-stone-50/30">
                      2. Planning & Reasoning
                    </td>
                    <td className="p-3">
                      Indirect Prompt Injection (OWASP LLM01) embedded inside journal entries instructing Gemini to alter behavior or leak system prompts.
                    </td>
                    <td className="p-3 text-emerald-800">
                      Delimited XML boundaries (<code className="font-mono text-[11px]">&lt;user_journal_entry&gt;</code>); strict system instructions declaring user text as passive prose; JSON schema constraints.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-stone-900 bg-stone-50/30">
                      3. Tool Execution
                    </td>
                    <td className="p-3">
                      Dynamic code evaluation (RCE), unauthorized SSRF calls, privilege escalation via tool routing.
                    </td>
                    <td className="p-3 text-emerald-800">
                      Zero dynamic code execution; all AI interactions execute purely via server-side schema-enforced inference endpoints without external execution tools.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-stone-900 bg-stone-50/30">
                      4. Memory & State
                    </td>
                    <td className="p-3">
                      Cross-user data leakage, unauthenticated document reads/writes, or storage corruption (OWASP A01).
                    </td>
                    <td className="p-3 text-emerald-800">
                      Strict owner-bound path checking (<code className="font-mono text-[11px]">request.auth.uid == userId</code>); client-side vault isolation per user identity; zero-insecure defaults.
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-stone-900 bg-stone-50/30">
                      5. Inter-System Comm.
                    </td>
                    <td className="p-3">
                      API token leakage to client bundle, credential theft, man-in-the-middle attacks.
                    </td>
                    <td className="p-3 text-emerald-800">
                      Zero client-side Gemini tokens. Google Cloud Secret Manager / env var resolution exclusively in Node.js server.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Model Fallback Ladder */}
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-emerald-600" />
              2. Resilient Model Fallback Protocol
            </h3>
            <p className="text-xs text-stone-600 mb-3">
              Server-side calls automatically catch recoverable HTTP/API status codes (503 UNAVAILABLE, 429 RESOURCE_EXHAUSTED, 404 NOT_FOUND, 500 INTERNAL) and step down the ladder:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-semibold text-amber-700 block uppercase">1. Primary</span>
                <span className="font-mono font-medium text-stone-900 text-[11px]">gemini-3.6-flash</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-semibold text-stone-500 block uppercase">2. High-Avail.</span>
                <span className="font-mono font-medium text-stone-900 text-[11px]">gemini-3.1-flash-lite</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-semibold text-stone-500 block uppercase">3. Dynamic Alias</span>
                <span className="font-mono font-medium text-stone-900 text-[11px]">gemini-flash-latest</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-semibold text-stone-500 block uppercase">4. Deep Reasoning</span>
                <span className="font-mono font-medium text-stone-900 text-[11px]">gemini-3.7-flash</span>
              </div>
            </div>
          </div>

          {/* Section 3: Cloud Firestore Rules Preview */}
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600" />
              3. Firestore Security Rules (<span className="font-mono text-xs">firestore.rules</span>)
            </h3>
            <div className="bg-stone-900 rounded-xl p-4 text-stone-200 font-mono text-xs overflow-x-auto">
              <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/insights/{insightId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}</pre>
            </div>
          </div>

          {/* Section 4: Secret Management */}
          <div>
            <h3 className="font-serif text-base font-semibold text-stone-900 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-600" />
              4. Zero-Hardcoding Secret Hygiene
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              No API keys or tokens are stored in source code. Credentials are injected via Google Cloud Secret Manager and <code className="font-mono text-stone-800">process.env.GEMINI_API_KEY</code> on the backend. Cloud Run service accounts use IAM role <code className="font-mono text-stone-800">roles/secretmanager.secretAccessor</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
