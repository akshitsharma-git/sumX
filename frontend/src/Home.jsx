import { useState } from "react";
import "./Home.css";

function Home() {
  const [summary, setSummary] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSummary("");
    setError("");

    if (!url.startsWith("https://x.com/")) {
      setError("Enter a valid X post URL !!");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went Wrong!!");
        return;
      }

      setSummary(data.summary);
    } catch (err) {
      setError("Server is not Responding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="center">
      <div className="header">
        <div className="logo">
          <a href="/">
            <img
              src="/assets/sumX_4.png"
              alt="SumX Logo"
              style={{ marginLeft: "100px", height: "150px" }}
            />
          </a>
        </div>
        <div className="links">
          <a href="https://github.com/akshitsharma-git/sumX" target="_blank">
            <img
              src="/assets/GithubLogo_1.png"
              alt="Github Logo"
              style={{ height: "50px", marginRight: "20px" }}
            />
          </a>
          <a href="https://x.com/akshitinpublic" target="_blank">
            <img
              src="/assets/X_Logo.jpg"
              alt="X Logo"
              style={{ height: "50px", marginRight: "120px" }}
            />
          </a>
        </div>
      </div>
      <div className="main-body">
        <div className="tagline">
          <h1>Less Words, More Insight</h1>
        </div>
        <div className="search-box">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your X post URL here"
          />
          <button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Reading..." : "Summarize"}
          </button>
        </div>
        <div className="error-box">
          {error && <p className="error">{error}</p>}
        </div>
        <div className="summary-box">
          {loading && !summary && (
            <div className="loader">
              <div className="spinner"></div>
              <div className="loader-text">
                <p>Summarizing the post...</p>
                <p>Hang tight, this takes a moment</p>
              </div>
              
            </div>
          )}

          {summary && (
            <div className="summary">
              <div className="card-header">
                <div className="traffic-light red"></div>
                <div className="traffic-light yellow"></div>
                <div className="traffic-light green"></div>
              </div>

              <div className="summary-text">
                <p>{summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
