(function () {
  var script = document.currentScript;
  var key = script && script.getAttribute("data-key");
  if (!key) return;
  var base = (function () {
    try {
      return new URL(script.src).origin;
    } catch (e) {
      return "";
    }
  })();
  var api = base + "/api/widget/" + encodeURIComponent(key);

  // id do visitante (persistente)
  var vid = localStorage.getItem("amzc_wgt_vid");
  if (!vid) {
    vid = "v" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("amzc_wgt_vid", vid);
  }

  var cfg = { agent_name: "Assistente", greeting: "Olá! Como posso ajudar?" };

  // estilos
  var css = document.createElement("style");
  css.textContent =
    ".amzc-bbl{position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#7c3aed;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);z-index:2147483000;font-size:24px}" +
    ".amzc-pnl{position:fixed;bottom:88px;right:20px;width:340px;max-width:92vw;height:460px;max-height:74vh;background:#fff;border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:none;flex-direction:column;overflow:hidden;z-index:2147483000;font-family:system-ui,Arial,sans-serif}" +
    ".amzc-hd{background:#7c3aed;color:#fff;padding:12px 14px;font-weight:600}" +
    ".amzc-msgs{flex:1;overflow-y:auto;padding:12px;background:#f7f7fb}" +
    ".amzc-m{margin:6px 0;padding:8px 11px;border-radius:12px;max-width:80%;font-size:14px;line-height:1.35;white-space:pre-wrap}" +
    ".amzc-in{background:#ece9fb;color:#222;margin-left:auto}" +
    ".amzc-out{background:#fff;color:#222;border:1px solid #eee}" +
    ".amzc-ft{display:flex;border-top:1px solid #eee}" +
    ".amzc-ft input{flex:1;border:0;padding:12px;font-size:14px;outline:none}" +
    ".amzc-ft button{border:0;background:#7c3aed;color:#fff;padding:0 16px;cursor:pointer}";
  document.head.appendChild(css);

  var bubble = document.createElement("div");
  bubble.className = "amzc-bbl";
  bubble.innerHTML = "💬";
  var panel = document.createElement("div");
  panel.className = "amzc-pnl";
  panel.innerHTML =
    '<div class="amzc-hd"></div><div class="amzc-msgs"></div>' +
    '<div class="amzc-ft"><input type="text" placeholder="Escreva..."/><button>➤</button></div>';
  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var hd = panel.querySelector(".amzc-hd");
  var msgs = panel.querySelector(".amzc-msgs");
  var input = panel.querySelector("input");
  var sendBtn = panel.querySelector("button");
  var greeted = false;

  function add(text, cls) {
    var d = document.createElement("div");
    d.className = "amzc-m " + cls;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
  }

  fetch(api).then(function (r) { return r.json(); }).then(function (j) {
    if (j && j.agent_name) cfg = j;
    hd.textContent = cfg.agent_name || "Assistente";
  }).catch(function () {});

  function toggle() {
    var open = panel.style.display === "flex";
    panel.style.display = open ? "none" : "flex";
    if (!open && !greeted) {
      greeted = true;
      add(cfg.greeting || "Olá! Como posso ajudar?", "amzc-out");
      input.focus();
    }
  }
  bubble.addEventListener("click", toggle);

  function send() {
    var text = (input.value || "").trim();
    if (!text) return;
    add(text, "amzc-in");
    input.value = "";
    var typing = document.createElement("div");
    typing.className = "amzc-m amzc-out";
    typing.textContent = "…";
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;
    fetch(api, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: vid, text: text }),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        typing.remove();
        add((j && j.reply) || "…", "amzc-out");
      })
      .catch(function () {
        typing.remove();
        add("Ops, tente novamente.", "amzc-out");
      });
  }
  sendBtn.addEventListener("click", send);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") send();
  });
})();
