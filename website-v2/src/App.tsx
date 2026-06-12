import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  clearSession,
  confirmUser,
  getAccessToken,
  getGoogleLoginUrl,
  loginWithEmail,
  parseCognitoCallback,
  registerUser,
} from "./auth";
import {
  deleteImage,
  fetchImages,
  findSimilarByImage,
  searchByTags,
  updateTags,
  uploadImage,
} from "./api";
import { CONFIG } from "./config";
import type { AlbumImage, AuthView, TagMap } from "./types";

const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validateImage(file: File) {
  if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type))
    return "JPG or PNG only.";
  if (file.size / 1024 / 1024 >= CONFIG.maxImageSizeMb)
    return `Max file size is ${CONFIG.maxImageSizeMb} MB.`;
  return "";
}

function parseTagQuery(query: string): TagMap {
  return query.split(",").reduce<TagMap>((acc, pair) => {
    const [rawName, rawCount] = pair.split(":");
    const name = rawName?.trim().toLowerCase();
    const count = parseInt(rawCount || "1", 10);
    if (name) acc[name] = isNaN(count) ? 1 : count;
    return acc;
  }, {});
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function AuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setStatus("");
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      onAuthenticated();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setStatus("");
    if (!passwordPattern.test(password)) {
      setStatus(
        "Password needs uppercase, lowercase, number, symbol, 8+ chars.",
      );
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, givenName, familyName);
      setView("confirm");
      setStatus("Check your email for the verification code.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    setStatus("");
    setLoading(true);
    try {
      await confirmUser(email, code);
      setView("login");
      setStatus("Email confirmed. You can sign in now.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Confirmation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <div className="wordmark">
          <div className="wordmark-dot" />
          Spotted
        </div>
        <p className="auth-sub">
          {view === "confirm"
            ? "Check your email for a code"
            : "Sign in to your account"}
        </p>

        {view !== "confirm" && (
          <div className="tabs">
            <button
              className={view === "login" ? "active" : ""}
              onClick={() => setView("login")}
            >
              Login
            </button>
            <button
              className={view === "register" ? "active" : ""}
              onClick={() => setView("register")}
            >
              Register
            </button>
          </div>
        )}

        {view !== "confirm" && (
          <>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
          </>
        )}

        {view === "register" && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <label>
              First name
              <input
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                placeholder="Alex"
              />
            </label>
            <label>
              Last name
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="Smith"
              />
            </label>
          </div>
        )}

        {view === "confirm" && (
          <label>
            Verification code
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
            />
          </label>
        )}

        {view === "login" && (
          <button className="primary" disabled={loading} onClick={handleLogin}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        )}
        {view === "register" && (
          <button
            className="primary"
            disabled={loading}
            onClick={handleRegister}
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        )}
        {view === "confirm" && (
          <button
            className="primary"
            disabled={loading}
            onClick={handleConfirm}
          >
            {loading ? "Verifying…" : "Verify email"}
          </button>
        )}

        {view === "login" && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: "12px 0",
              }}
            >
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
              <span style={{ fontSize: 11, color: "var(--hint)" }}>or</span>
              <div
                style={{ flex: 1, height: 1, background: "var(--border)" }}
              />
            </div>
            <button
              className="google"
              onClick={() => {
                window.location.href = getGoogleLoginUrl();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </>
        )}

        {status && <p className="status">{status}</p>}

        <div className="demo-box">
          <strong>Demo account</strong>
          <div>
            Email: <code>shiki65536@gmail.com</code>
          </div>
          <div>
            Password: <code>Qwer1234~</code>
          </div>
        </div>
      </div>
    </main>
  );
}

// ── Tag editor modal ───────────────────────────────────────────────────────────

function TagEditor({
  image,
  onClose,
  onSave,
}: {
  image: AlbumImage;
  onClose: () => void;
  onSave: (image: AlbumImage) => void;
}) {
  const [tags, setTags] = useState<TagMap[]>(image.tags || []);

  const updateName = (i: number, next: string) =>
    setTags((t) =>
      t.map((tag, idx) =>
        idx !== i ? tag : { [next]: tag[Object.keys(tag)[0]] || 0 },
      ),
    );

  const updateCount = (i: number, next: number) =>
    setTags((t) =>
      t.map((tag, idx) => {
        if (idx !== i) return tag;
        const k = Object.keys(tag)[0];
        return { [k]: next };
      }),
    );

  const removeTag = (i: number) =>
    setTags((t) => t.filter((_, idx) => idx !== i));

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h2>Edit tags</h2>
          <button className="ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-body">
          <img className="modal-image" src={image.link} alt="" />
          <div className="tag-editor">
            {tags.map((tag, i) => {
              const name = Object.keys(tag)[0];
              return (
                <div className="tag-row" key={`${name}-${i}`}>
                  <input
                    value={name}
                    onChange={(e) => updateName(i, e.target.value)}
                    placeholder="tag"
                  />
                  <input
                    type="number"
                    min="0"
                    value={tag[name]}
                    onChange={(e) =>
                      updateCount(i, parseInt(e.target.value || "0", 10))
                    }
                  />
                  <button className="del-btn" onClick={() => removeTag(i)}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <button
            className="btn-add-tag"
            onClick={() => setTags((t) => [...t, { "": 0 }])}
          >
            + Add tag
          </button>
        </div>
        <div className="modal-footer">
          <button className="ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            onClick={() => onSave({ ...image, tags })}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Album page ─────────────────────────────────────────────────────────────────

function AlbumPage({ onLogout }: { onLogout: () => void }) {
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [visibleImages, setVisibleImages] = useState<AlbumImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const similarInputRef = useRef<HTMLInputElement | null>(null);

  const imageCountLabel = useMemo(
    () => `${images.length} / ${CONFIG.maxAlbumImages}`,
    [images.length],
  );

  async function loadImages() {
    setLoading(true);
    try {
      const data = await fetchImages();
      setImages(data);
      setVisibleImages(data);
    } catch {
      setNotice("Unable to load album. Please refresh.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadImages();
  }, []);

  async function handleUpload(file: File | undefined) {
    if (!file) return;
    const err = validateImage(file);
    if (err) {
      setNotice(err);
      return;
    }
    if (images.length >= CONFIG.maxAlbumImages) {
      setNotice("Demo limit reached. Delete an image to upload more.");
      return;
    }
    setLoading(true);
    setNotice("Uploading — tags will appear shortly…");
    try {
      await uploadImage(file);
      await new Promise((r) => window.setTimeout(r, 3500));
      await loadImages();
      setNotice("");
    } catch {
      setNotice("Upload failed. Try a smaller JPG or PNG.");
    } finally {
      setLoading(false);
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  }

  async function handleFindSimilar(file: File | undefined) {
    if (!file) return;
    const err = validateImage(file);
    if (err) {
      setNotice(err);
      return;
    }
    setLoading(true);
    setNotice("Detecting objects in reference image…");
    try {
      const results = await findSimilarByImage(file);
      setVisibleImages(results);
      setNotice(results.length ? "" : "No similar images found.");
    } catch {
      setNotice("Image search failed.");
    } finally {
      setLoading(false);
      if (similarInputRef.current) similarInputRef.current.value = "";
    }
  }

  async function handleTagSearch() {
    if (!query.trim()) {
      setVisibleImages(images);
      return;
    }
    if (!query.includes(":")) {
      setNotice("Format: person:1, dog:1");
      return;
    }
    setLoading(true);
    try {
      const results = await searchByTags(parseTagQuery(query));
      setVisibleImages(results);
      setNotice(results.length ? "" : "No matches found.");
    } catch {
      setNotice("Tag search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(imageID: string) {
    setLoading(true);
    try {
      await deleteImage(imageID);
      await loadImages();
    } catch {
      setNotice("Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveTags(image: AlbumImage) {
    setLoading(true);
    try {
      await updateTags(image);
      setSelectedImage(null);
      await loadImages();
    } catch {
      setNotice("Could not save tags.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-wordmark">
            <div className="wordmark-dot" />
            Spotted
          </div>
          <span className="topbar-tagline">Upload, tag, search.</span>
        </div>
        <div className="topbar-actions">
          <span className="usage-pill">{imageCountLabel}</span>
          <button className="ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </header>

      {/* Toolbar section */}
      <div className="toolbar-section">
        <div className="search-wrap">
          <svg
            className="search-icon"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setVisibleImages(images);
            }}
            onKeyDown={(e) => e.key === "Enter" && void handleTagSearch()}
            placeholder="Filter by tag — person:1, dog:1"
          />
        </div>
        <input
          ref={similarInputRef}
          className="hidden-input"
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => void handleFindSimilar(e.target.files?.[0])}
        />
        <button
          className="secondary"
          onClick={() => similarInputRef.current?.click()}
        >
          Search by image
        </button>
        <input
          ref={uploadInputRef}
          className="hidden-input"
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => void handleUpload(e.target.files?.[0])}
        />
        <button
          className="btn-upload"
          onClick={() => uploadInputRef.current?.click()}
        >
          Upload
        </button>
      </div>

      {/* Gallery */}
      <div className="gallery-area">
        {notice && <p className="notice">{notice}</p>}
        {loading && <p className="loading">Loading…</p>}

        {!loading && images.length === 0 ? (
          <div className="empty-state">
            <div className="orb">🖼</div>
            <h2>No images yet</h2>
            <p>
              Upload your first photo and YOLO will detect objects
              automatically.
            </p>
            <div className="tips">
              {["person", "dog", "cat", "car", "bottle", "chair"].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <button
              className="primary"
              style={{ width: "auto", padding: "8px 20px" }}
              onClick={() => uploadInputRef.current?.click()}
            >
              Upload a photo
            </button>
          </div>
        ) : (
          <div className="gallery-grid">
            {visibleImages.map((img) => {
              const isPending = !img.tags || img.tags.length === 0;
              return (
                <article className="image-card" key={img.imageID}>
                  <img src={img.link} alt="" />
                  <div className="card-body">
                    <div className="tag-list">
                      {isPending ? (
                        <span className="tag-pill pending">detecting…</span>
                      ) : (
                        img.tags.slice(0, 6).map((tag, i) => {
                          const name = Object.keys(tag)[0];
                          return (
                            <span key={i} className="tag-pill">
                              {name} ×{tag[name]}
                            </span>
                          );
                        })
                      )}
                    </div>
                    <div className="card-actions">
                      <button onClick={() => setSelectedImage(img)}>
                        Edit tags
                      </button>
                      <button
                        className="danger"
                        onClick={() => void handleDelete(img.imageID)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedImage && (
        <TagEditor
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onSave={(img) => void handleSaveTags(img)}
        />
      )}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────

function App() {
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(getAccessToken()),
  );

  useEffect(() => {
    if (parseCognitoCallback()) setAuthenticated(true);
  }, []);

  if (!authenticated)
    return <AuthPanel onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <AlbumPage
      onLogout={() => {
        clearSession();
        setAuthenticated(false);
      }}
    />
  );
}

export default App;
