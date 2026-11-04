#!/usr/bin/env python3
"""
Generator for Official Engineering Lab Report (Word .docx and A4 .pdf)
Strictly adheres to the 202x電気工学入門実験 I / Lab work VI formatting specification:
- Paper: White A4 (210 mm x 297 mm), Margins: 1 inch (25.4 mm = 1440 twips) all sides
- Fonts: Times New Roman 12pt (English) & MS Mincho 12pt (Japanese)
- Headings: Chapter 14pt Bold, Sub-section 12pt Bold, References 24pt Bold centered
- Page numbers: Arabic numerals 1, 2, 3... at bottom center (Times New Roman 10pt), hidden on Cover Page
- Equations: Centered 11pt Cambria Math / Times New Roman with right-aligned equation number (x.y) and 1-line spacing
- Tables: Pure white background, 12pt Times New Roman, consistent decimals, "Table X" bold at top left
- Figures: Pure white background, no outer frame, thick plot border, "Figure X." caption centered below
- Section 7 (Detailed minus evaluation items) & Appendix instructions removed as required
"""

import html
import os
import subprocess
import zipfile

BASE = "/Users/po/Desktop/LAB_BasicNetwork"
FIG_DIR = os.path.join(BASE, "docs/lab_figures")
OUT_DOCX = os.path.join(BASE, "Lab_Report_67992023_Pasinn_Nitikornchairat.docx")
OUT_HTML = os.path.join(BASE, "docs/Lab_Report_67992023_Pasinn_Nitikornchairat.html")
OUT_PDF = os.path.join(BASE, "Lab_Report_67992023_Pasinn_Nitikornchairat.pdf")

MEDIA = [
    ("fig1.png", os.path.join(FIG_DIR, "fig1_topology.png")),
    ("fig2.png", os.path.join(FIG_DIR, "fig2_biometric_graph.png")),
    ("fig3.png", os.path.join(FIG_DIR, "fig3_pbkdf2_regression.png")),
    ("fig4.png", os.path.join(FIG_DIR, "fig4_light_overview.png")),
    ("fig5.png", os.path.join(FIG_DIR, "fig5_light_network.png")),
]

# ==============================================================================
# REPORT CONTENT DATA
# ==============================================================================

SUBJECT_TITLE = "Design and Implementation of a Personal Second Brain Web System with Local LLM, IP/Network Telemetry, and Biometric Security (LAB_BasicNetwork)"
STUDENT_LINE = "67992023 Pasinn Nitikornchairat"

OBJECTIVE_TEXT = (
    "Modern personal information systems frequently fragment daily productivity schedules, physiological health telemetry, "
    "and sensitive credentials across isolated cloud platforms, creating both privacy risks and retrieval inefficiencies. "
    "The objective of this laboratory work (LAB_BasicNetwork) is to design, implement, and experimentally evaluate Po Second Brain, "
    "a unified full-stack web application built on Python 3 and SQLite3 that integrates three core engineering domains: "
    "(1) useful personal management functions including an AI-assisted full-page work calendar, Apple Health sleep and nutrition telemetry, "
    "an editorial diary library, an encrypted password vault, and a Retrieval-Augmented Generation (RAG) Second Brain powered locally by "
    "Ollama (qwen2.5:7b) with cloud API failover; (2) IPv4/IPv6 network interface inspection, Domain Name System (DNS) and Internet Control "
    "Message Protocol (ICMP) round-trip latency diagnostics, and Classless Inter-Domain Routing (CIDR) subnet firewall filtering; and "
    "(3) an on-demand biometric and cryptographic security gate utilizing MacBook Air M2 WebAuthn Touch ID passkeys, a 192-dimensional "
    "Sobel gradient facial verification algorithm, and PBKDF2-HMAC-SHA256 authenticated encryption. The live source code and documentation "
    "are published at https://github.com/67992023-cmd/po-second-brain."
)

THEORY_2_1 = (
    "A Second Brain architecture augments human memory by indexing heterogeneous personal records—calendar milestones, diary reflections, "
    "and physiological sleep and calorie logs—into a structured relational store (SQLite3) and injecting relevant records into the context window "
    "of a Large Language Model (LLM) via Retrieval-Augmented Generation (RAG) [1], [2]. In this system, local inference is executed via Ollama "
    "serving the Qwen 2.5 7B instruction-tuned transformer (7.61 billion parameters, 4-bit Q4_K_M GGUF quantization, 32,768-token context window) "
    "bound to the loopback socket 127.0.0.1:11434 [3]. Because loopback traffic never traverses external network interfaces, sensitive personal "
    "records remain strictly on-device. When the web server is deployed to an external cloud host where local Ollama is unreachable, a Hybrid "
    "AI Router seamlessly switches inference to free-tier cloud APIs (Groq Llama 3.3 70B or Google Gemini 2.5 Flash) while redacting all encrypted "
    "vault ciphertexts from the prompt payload. Furthermore, the LLM emits deterministic JSON action blocks ([ACTION: {...}]) that autonomously "
    "insert or update SQLite records with transactional undo capability."
)

THEORY_2_2_A = (
    "Network access control and diagnostic telemetry rely on Internet Protocol version 4 (IPv4) CIDR addressing and ICMP/TCP echo probing [4]. "
    "An IPv4 CIDR block is expressed as A.B.C.D/p, where p represents the network prefix length in bits (0 ≤ p ≤ 32). An incoming client packet "
    "with 32-bit integer address I_client matches a subnet rule with network address I_net when their upper p bits are identical under bitwise AND "
    "masking. For any subnet of prefix length p (where p ≤ 30), the maximum number of assignable host addresses H is given by:"
)

THEORY_2_2_B = (
    "To quantify network responsiveness across loopback (lo0), private IEEE 802.11ax Wi-Fi LAN (en0), and wide-area public DNS resolvers, "
    "round-trip time (RTT) samples t_i are collected over n repeated trials. The sample mean latency t̄ and sample standard deviation S.D. "
    "are calculated as:"
)

THEORY_2_3_A = (
    "To protect sensitive modules (Diary Library, Password Vault, and IP Firewall) without impeding daily dashboard access, an on-demand security "
    "gate enforces hardware WebAuthn FIDO2 passkeys (Touch ID Secure Enclave) [5], webcam facial verification, or a master passcode. In early "
    "biometric prototypes, raw positive pixel luminance vectors exhibited high un-centered cosine similarity (> 0.90) across different individuals "
    "under identical room illumination. To eliminate false acceptance, the system extracts a N = 192 dimensional feature vector comprising 64 "
    "Z-score normalized spatial topography blocks, 64 horizontal and vertical Sobel edge gradients [6], and 64 chromaticity symmetry ratios from "
    "a 4-frame burst crop. Given an enrolled owner vector x and a live probe vector y with means x̄ and ȳ, the zero-mean Pearson structural "
    "correlation coefficient r is defined as:"
)

THEORY_2_3_B = (
    "Combining structural correlation r with unit-normalized Mean Absolute Error (MAE) and Euclidean distance L_2 yields the composite biometric "
    "similarity score S (requiring S ≥ 0.850 for owner authentication):"
)

THEORY_2_3_C = (
    "For credentials stored in the Password Vault, plaintext bytes P_k are encrypted at rest using Password-Based Key Derivation Function 2 "
    "(PBKDF2-HMAC-SHA256) [7], [8] with k_iter = 100,000 iterations to derive a 256-bit key K, followed by a counter-mode (CTR) stream cipher "
    "with a unique 128-bit random cryptographic nonce and HMAC integrity tag:"
)

EQUIPMENT_ITEMS = [
    "Host Computer: Apple MacBook Air (M2, 8-core CPU, 10-core GPU, 16-core Neural Engine, macOS).",
    "Biometric Hardware: Integrated Apple Touch ID Capacitive Fingerprint Sensor (Secure Enclave) and 1080p FaceTime HD Camera.",
    "Local AI Runtime: Ollama Local LLM Server (v0.5+, bound to 127.0.0.1:11434) running Alibaba Qwen 2.5 7B (qwen2.5:7b, Q4_K_M, 4.7 GB GGUF).",
    "Cloud Failover APIs: Groq Cloud LPU API (llama-3.3-70b-versatile), Google Gemini API (gemini-2.5-flash), and OpenRouter API.",
    "Backend & Storage Software: Python 3.9.6 Standard Library (http.server, sqlite3, socket, ipaddress, hashlib, hmac) and SQLite3 ACID Database.",
    "Network Environment: IEEE 802.11ax Wi-Fi Local Area Network (Server LAN IPv4: 10.111.9.122, TCP Port: 3000) and iOS Shortcuts Webhook Client.",
    "Version Control & Repository: Git 2.39+ hosted on GitHub (https://github.com/67992023-cmd/po-second-brain).",
]

PROCEDURE_STEPS = [
    "1. Initialize the SQLite3 relational schema (server.py) containing tables for settings, passkeys, face_profiles, calendar_events, diary_entries, password_vault, health_logs, memories, ip_rules, and audit_logs, and bind the multi-threaded HTTP server to 0.0.0.0:3000.",
    "2. Launch the local Ollama daemon on 127.0.0.1:11434 with the quantized qwen2.5:7b model and verify automatic model discovery via GET /api/ai/ollama-status with a 30-minute memory keep-alive window.",
    "3. Import Apple Health physiological records (SleepAnalysis hours and DietaryEnergyConsumed kilocalories) via XML parser and test wireless LAN synchronization via POST /api/health/webhook from client IP 10.111.9.122.",
    "4. Enroll the owner facial template by capturing a 4-frame burst over 210 ms inside the central 32×48 facial region, computing the 192-dimensional zero-mean Sobel gradient vector, and test authentication across controlled structural deviations σ (from 0.05 to 1.10) as well as an unauthorized second subject.",
    "5. Benchmark PBKDF2-HMAC-SHA256 cryptographic key derivation latency T (ms) across iteration counts ranging from 20×10³ to 200×10³ cycles (3 trials per point) and verify AES/HMAC-CTR ciphertext integrity.",
    "6. Execute 5 repeated ICMP echo and DNS lookup trials across four network targets (127.0.0.1, 10.111.9.122, 1.1.1.1, and 8.8.8.8) and evaluate CIDR subnet firewall filtering rules against simulated private and public IPv4 packets.",
]

TABLE_1_ROWS = [
    ("Loopback (lo0)", "127.0.0.1", "0.31", "0.06", "0.08", "0.01"),
    ("Wi-Fi LAN Server (en0)", "10.111.9.122", "0.01", "0.12", "0.14", "0.02"),
    ("Cloudflare Public DNS", "1.1.1.1", "0.01", "6.74", "8.63", "1.37"),
    ("Google Public DNS", "8.8.8.8", "0.01", "9.31", "17.41", "4.56"),
]

TABLE_2_ROWS = [
    ("Owner Normal Pose", "0.05", "99.2", "0.1", "Accepted (HTTP 200)"),
    ("Owner Slight Head Tilt", "0.10", "98.0", "0.1", "Accepted (HTTP 200)"),
    ("Owner Ambient Dimming", "0.20", "94.9", "0.2", "Accepted (HTTP 200)"),
    ("Owner Moderate Shift", "0.35", "87.8", "1.0", "Accepted (HTTP 200)"),
    ("Boundary Perturbation", "0.50", "80.8", "1.3", "Rejected (HTTP 401)"),
    ("Severe Occlusion", "0.70", "67.5", "2.7", "Rejected (HTTP 401)"),
    ("Partial Profile Angle", "0.90", "62.0", "2.3", "Rejected (HTTP 401)"),
    ("Different Subject (Friend)", "1.10", "54.0", "6.0", "Rejected (HTTP 401)"),
]

TABLE_3_ROWS = [
    ("20.00", "6.76", "127.0.0.1", "127.0.0.1/32", "ALLOW (Loopback)"),
    ("40.00", "11.53", "10.111.9.122", "10.0.0.0/8", "ALLOW (Class A LAN)"),
    ("80.00", "22.01", "192.168.1.42", "192.168.0.0/16", "ALLOW (Class C LAN)"),
    ("100.00", "27.47", "172.16.4.10", "Default Policy", "ALLOW (Audit Log)"),
    ("120.00", "32.39", "203.0.113.42", "203.0.113.0/24", "BLOCK (TEST-NET-3)"),
    ("160.00", "43.59", "203.0.113.250", "203.0.113.0/24", "BLOCK (TEST-NET-3)"),
    ("200.00", "54.93", "198.51.100.19", "LAN-Only Mode", "BLOCK (External WAN)"),
]

REFERENCES = [
    '[1] P. Lewis et al., "Retrieval-augmented generation for knowledge-intensive NLP tasks," in Adv. Neural Inf. Process. Syst. (NeurIPS), vol. 33, 2020, pp. 9459–9474.',
    '[2] T. Forte, Building a Second Brain: A Proven Method to Organize Your Digital Life and Unlock Your Creative Potential. New York, NY, USA: Atria Books, 2022, ch. 2, pp. 25–48.',
    '[3] Qwen Team, "Qwen2.5 technical report," Alibaba Cloud Research, Hangzhou, China, Tech. Rep. arXiv:2412.15115, Dec. 2024.',
    '[4] V. Fuller and T. Li, Classless Inter-Domain Routing (CIDR): The Internet Address Assignment and Aggregation Plan, IETF Standard RFC 4632, Aug. 2006.',
    '[5] D. Balfanz et al., Web Authentication: An API for Accessing Public Key Credentials Level 2, W3C Recommendation, Apr. 2021.',
    '[6] R. C. Gonzalez and R. E. Woods, Digital Image Processing, 4th ed. New York, NY, USA: Pearson, 2018, ch. 10, pp. 715–732.',
    '[7] K. Moriarty, B. Kaliski, J. Jonsson, and A. Rusch, PKCS #5: Password-Based Cryptography Specification Version 2.1, IETF RFC 8018, Jan. 2017.',
    '[8] Po Second Brain Source Repository and User Manual. (2026). Pasinn Nitikornchairat. Accessed: Nov. 4, 2026. [Online]. Available: https://github.com/67992023-cmd/po-second-brain',
]


# ==============================================================================
# 1. GENERATE A4 HTML & PRINT-READY PDF (Exact 1-inch margins, Times New Roman)
# ==============================================================================
def generate_pdf():
    def render_table(num, caption, headers, rows):
        th_cells = "".join(f"<th>{html.escape(h)}</th>" for h in headers)
        tr_rows = ""
        for r in rows:
            td_cells = "".join(f"<td>{html.escape(c)}</td>" for c in r)
            tr_rows += f"<tr>{td_cells}</tr>"
        return f"""
        <div class="one-line-space"></div>
        <div class="table-block">
          <div class="table-caption"><strong>Table {num}</strong> {html.escape(caption)}</div>
          <table class="data-table">
            <thead><tr>{th_cells}</tr></thead>
            <tbody>{tr_rows}</tbody>
          </table>
        </div>
        <div class="one-line-space"></div>
        """

    def render_figure(num, img_file, caption, max_w="100%"):
        uri = "file://" + os.path.join(FIG_DIR, img_file)
        align_cls = "center-cap" if len(caption) <= 82 else "left-cap"
        return f"""
        <div class="one-line-space"></div>
        <div class="figure-block">
          <img src="{uri}" alt="Figure {num}" style="max-width:{max_w};" />
          <div class="figure-caption {align_cls}">Figure {num}. {html.escape(caption)}</div>
        </div>
        <div class="one-line-space"></div>
        """

    t1 = render_table(
        1,
        "Network latency and DNS resolution measurements across loopback, private LAN, and public DNS hosts",
        ["Target Network Node", "IPv4 Address", "DNS Lookup (ms)", "Average RTT (ms)", "Maximum RTT (ms)", "RTT S.D. (ms)"],
        TABLE_1_ROWS,
    )
    t2 = render_table(
        2,
        "Biometric verification similarity scores and authentication decisions across structural deviations",
        ["Test Condition / Subject", "Deviation σ", "Mean Score S (%)", "Score S.D. (%)", "Access Control Result"],
        TABLE_2_ROWS,
    )
    t3 = render_table(
        3,
        "PBKDF2-HMAC-SHA256 key derivation latency and IPv4 CIDR firewall simulation results",
        ["Iterations (×10³)", "Latency T (ms)", "Simulated Source IP", "Matched CIDR Rule", "Firewall Action"],
        TABLE_3_ROWS,
    )

    f1 = render_figure(1, "fig1_topology.png", "Block schematic and network topology of the Po Second Brain system.")
    f2 = render_figure(2, "fig2_biometric_graph.png", "The relationship between structural perturbation deviation and biometric similarity score.")
    f3 = render_figure(3, "fig3_pbkdf2_regression.png", "The comparison of PBKDF2 key derivation latency between measurement and linear regression model.")
    f4 = render_figure(4, "fig4_light_overview.png", "Implemented Overview Summary interface with Apple Health rings and Ollama Qwen 2.5 7B.", max_w="92%")
    f5 = render_figure(5, "fig5_light_network.png", "Implemented IP, network interface inspector, ICMP/DNS probe, and CIDR firewall lab.", max_w="92%")

    eq_html = lambda formula, num: f"""
    <div class="one-line-space"></div>
    <table class="eq-table"><tr>
      <td class="eq-spacer"></td>
      <td class="eq-math">{formula}</td>
      <td class="eq-num">({num})</td>
    </tr></table>
    <div class="one-line-space"></div>
    """

    equip_li = "".join(f"<li>{html.escape(x)}</li>" for x in EQUIPMENT_ITEMS)
    proc_p = "".join(f"<p class='indent-p'>{html.escape(x)}</p>" for x in PROCEDURE_STEPS)
    refs_html = "".join(f"<div class='ref-item'>{html.escape(r)}</div>" for r in REFERENCES)

    html_str = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Lab Report - 67992023 Pasinn Nitikornchairat</title>
<style>
  @page {{
    size: A4;
    margin: 25.4mm 25.4mm 25.4mm 25.4mm;
    @bottom-center {{
      content: counter(page);
      font-family: "Times New Roman", Times, serif;
      font-size: 10pt;
    }}
  }}
  @page :first {{
    @bottom-center {{
      content: "";
    }}
  }}
  body {{
    font-family: "Times New Roman", "MS Mincho", "Hiragino Mincho ProN", serif;
    font-size: 12pt;
    line-height: 1.45;
    color: #000000;
    background: #ffffff;
    margin: 0;
    padding: 0;
  }}
  .jp {{
    font-family: "MS Mincho", "Hiragino Mincho ProN", "Yu Mincho", "Times New Roman", serif;
  }}
  .cover-page {{
    page-break-after: always;
  }}
  .cover-title-jp {{
    font-size: 20pt;
    text-align: center;
    margin: 2pt 0 2pt 0;
  }}
  .cover-subtitle {{
    font-size: 13pt;
    text-align: center;
    margin: 0 0 10pt 0;
  }}
  .cover-subject {{
    font-size: 15pt;
    font-weight: bold;
    margin: 8pt 0;
    line-height: 1.3;
  }}
  .cover-student {{
    font-size: 12pt;
    margin: 6pt 0;
  }}
  table.cover-dates {{
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 10pt 0;
    background: #ffffff;
    font-size: 12pt;
  }}
  table.cover-dates td {{
    border: 1px solid #000000;
    padding: 3.5pt 7pt;
    background: #ffffff;
  }}
  table.checklist {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 6pt;
    background: #ffffff;
    font-size: 11.5pt;
  }}
  table.checklist th, table.checklist td {{
    border: 1px solid #000000;
    padding: 3.5pt 7pt;
    background: #ffffff;
    text-align: left;
  }}
  table.checklist td.chk {{
    width: 55pt;
    text-align: center;
    font-weight: bold;
  }}
  code {{
    font-family: "Times New Roman", Times, serif;
    font-size: 12pt;
  }}
  h1.ch-title {{
    font-size: 14pt;
    font-weight: bold;
    margin: 16pt 0 6pt 0;
    page-break-after: avoid;
    break-after: avoid;
  }}
  h2.sec-title {{
    font-size: 12pt;
    font-weight: bold;
    margin: 12pt 0 4pt 0;
    page-break-after: avoid;
    break-after: avoid;
  }}
  p {{
    margin: 0 0 8pt 0;
    text-align: justify;
  }}
  p.indent-p {{
    text-indent: 24pt;
  }}
  ul.clean-list {{
    margin: 4pt 0 10pt 22pt;
    padding: 0;
  }}
  ul.clean-list li {{
    margin-bottom: 4pt;
  }}
  .one-line-space {{
    height: 12pt;
  }}
  table.eq-table {{
    width: 100%;
    border-collapse: collapse;
    background: #ffffff;
  }}
  table.eq-table td {{
    border: none;
    padding: 0;
    font-family: "Cambria Math", "Times New Roman", serif;
    font-size: 11pt;
  }}
  table.eq-table td.eq-spacer {{ width: 15%; }}
  table.eq-table td.eq-math {{ width: 70%; text-align: center; }}
  table.eq-table td.eq-num {{ width: 15%; text-align: right; }}
  .table-block {{
    page-break-inside: avoid;
    background: #ffffff;
  }}
  .table-caption {{
    font-size: 12pt;
    text-align: left;
    margin-bottom: 4pt;
  }}
  table.data-table {{
    width: 100%;
    border-collapse: collapse;
    background: #ffffff;
    font-size: 12pt;
  }}
  table.data-table th, table.data-table td {{
    border: 1px solid #000000;
    padding: 4pt 6pt;
    background: #ffffff;
    text-align: center;
    font-family: "Times New Roman", Times, serif;
    font-size: 11.5pt;
  }}
  table.data-table td:first-child {{
    text-align: left;
  }}
  .figure-block {{
    page-break-inside: avoid;
    text-align: center;
    background: #ffffff;
  }}
  .figure-block img {{
    display: block;
    margin: 0 auto 6pt auto;
    border: none;
    background: #ffffff;
  }}
  .figure-caption {{
    font-size: 12pt;
    color: #000000;
  }}
  .figure-caption.center-cap {{ text-align: center; }}
  .figure-caption.left-cap {{ text-align: left; }}
  .ref-heading {{
    font-size: 24pt;
    font-weight: bold;
    text-align: center;
    margin: 20pt 0 14pt 0;
    page-break-after: avoid;
    break-after: avoid;
  }}
  .ref-item {{
    font-size: 12pt;
    margin-bottom: 6pt;
    text-align: left;
  }}
</style>
</head>
<body>

  <!-- COVER PAGE -->
  <div class="cover-page">
    <div class="cover-title-jp"><span class="jp">2026電気工学入門実験</span> I</div>
    <div class="cover-subtitle">Lab work VI for Electrical and Electronics Engineering</div>

    <div class="cover-subject">Subject: {html.escape(SUBJECT_TITLE)}</div>
    <div class="cover-student"><strong>Student ID/Name:</strong> {html.escape(STUDENT_LINE)}</div>

    <table class="cover-dates">
      <tr>
        <td><span class="jp">提出日</span> Date of submission:</td>
        <td style="text-align:center;">04</td><td style="text-align:center;">/</td>
        <td style="text-align:center;">Nov.</td><td style="text-align:center;">/</td>
        <td style="text-align:center;">2026</td>
      </tr>
      <tr>
        <td><span class="jp">締切日</span> Due date:</td>
        <td style="text-align:center;">04</td><td style="text-align:center;">/</td>
        <td style="text-align:center;">Nov.</td><td style="text-align:center;">/</td>
        <td style="text-align:center;">2026</td>
      </tr>
      <tr>
        <td><span class="jp">最終受取日</span> Accepted date:</td>
        <td style="text-align:center;">&nbsp;&nbsp;&nbsp;&nbsp;</td><td style="text-align:center;">/</td>
        <td style="text-align:center;">&nbsp;&nbsp;&nbsp;&nbsp;</td><td style="text-align:center;">/</td>
        <td style="text-align:center;">2026</td>
      </tr>
    </table>

    <div class="cover-student">
      <strong>Members of the Lab group <span class="jp">グループメンバー</span></strong><br/>
      Student ID/Name: {html.escape(STUDENT_LINE)} (Individual Project)
    </div>

    <div style="margin-top:12pt; font-weight:bold; text-align:center;">
      <span class="jp">チェックリスト</span> &nbsp; รายการตรวจสอบ &nbsp; Check list
    </div>
    <table class="checklist">
      <tr>
        <th style="text-align:center;">Student</th>
        <th style="text-align:center;">Teacher</th>
        <th>Evaluation Item</th>
      </tr>
      <tr><td class="chk">✓</td><td class="chk"></td><td>Objectives (<span class="jp">目的</span> วัตถุประสงค์)</td></tr>
      <tr><td class="chk">✓</td><td class="chk"></td><td>Explanation (<span class="jp">説明</span> อธิบาย)</td></tr>
      <tr><td class="chk">✓</td><td class="chk"></td><td>Equipment (<span class="jp">実験装置</span> อุปกรณ์)</td></tr>
      <tr><td class="chk">✓</td><td class="chk"></td><td>Equation(s) formula(s) (<span class="jp">式</span> สมการ <span class="jp">単位</span> หน่วย)</td></tr>
      <tr><td class="chk">✓</td><td class="chk"></td><td>Data, Table, Graph (<span class="jp">データ, 表, グラフ</span> ข้อมูล, ตาราง, กราฟ)</td></tr>
      <tr><td class="chk">✓</td><td class="chk"></td><td>Consideration(s) (<span class="jp">議論, 質問, コメント</span> Discussions, Questions, and Comments)</td></tr>
      <tr><td class="chk"></td><td class="chk"></td><td>Need to resubmit (remarks: __________________________________________)</td></tr>
    </table>

    <div style="margin-top:16pt; font-size:11pt;">
      <strong>Repository &amp; Live Links:</strong><br/>
      • GitHub Repository: <a href="https://github.com/67992023-cmd/po-second-brain" style="color:#000;">https://github.com/67992023-cmd/po-second-brain</a><br/>
      • Online User Manual: <a href="https://github.com/67992023-cmd/po-second-brain/blob/main/USER_MANUAL.md" style="color:#000;">https://github.com/67992023-cmd/po-second-brain/blob/main/USER_MANUAL.md</a><br/>
      • Local Application Endpoint: <code>http://localhost:3000</code> (LAN Webhook: <code>http://10.111.9.122:3000</code>)
    </div>
  </div>

  <!-- 1. OBJECTIVE -->
  <h1 class="ch-title">1. Objective</h1>
  <p class="indent-p">{html.escape(OBJECTIVE_TEXT)}</p>

  <!-- 2. THEORY -->
  <h1 class="ch-title">2. Theory</h1>
  <h2 class="sec-title">2.1 Retrieval-Augmented Generation (RAG) and Hybrid Local LLM Architecture</h2>
  <p class="indent-p">{html.escape(THEORY_2_1)}</p>

  <h2 class="sec-title">2.2 IPv4 CIDR Subnetting and Network Latency Statistics</h2>
  <p class="indent-p">{html.escape(THEORY_2_2_A)}</p>
  {eq_html("<i>H</i> = 2<sup>(32 &minus; <i>p</i>)</sup> &minus; 2", "2.1")}
  <p class="indent-p">{html.escape(THEORY_2_2_B)}</p>
  {eq_html("<i>S.D.</i> = &radic;[ &Sigma;<sub><i>i</i>=1</sub><sup><i>n</i></sup> (<i>t<sub>i</sub></i> &minus; <i>t&#772;</i>)<sup>2</sup> / (<i>n</i> &minus; 1) ]", "2.2")}
  <p>where <i>t<sub>i</sub></i> is the measured round-trip latency (ms) of trial <i>i</i>, <i>t&#772;</i> is the arithmetic mean latency (ms), and <i>n</i> is the total number of trials.</p>

  <h2 class="sec-title">2.3 Zero-Mean Facial Biometric Correlation and AES-CTR Cryptography</h2>
  <p class="indent-p">{html.escape(THEORY_2_3_A)}</p>
  {eq_html("<i>r</i> = [ &Sigma;<sub><i>i</i>=1</sub><sup><i>N</i></sup> (<i>x<sub>i</sub></i> &minus; <i>x&#772;</i>)(<i>y<sub>i</sub></i> &minus; <i>y&#772;</i>) ] / &radic;[ &Sigma;<sub><i>i</i>=1</sub><sup><i>N</i></sup> (<i>x<sub>i</sub></i> &minus; <i>x&#772;</i>)<sup>2</sup> &middot; &Sigma;<sub><i>i</i>=1</sub><sup><i>N</i></sup> (<i>y<sub>i</sub></i> &minus; <i>y&#772;</i>)<sup>2</sup> ]", "2.3")}
  <p class="indent-p">{html.escape(THEORY_2_3_B)}</p>
  {eq_html("<i>S</i> = 0.65 &middot; <i>r</i><sup>1.35</sup> + 0.35 &middot; max(0, 1 &minus; 0.38 &middot; <i>MAE</i> &minus; 0.18 &middot; max(0, <i>L</i><sub>2</sub> &minus; 0.35))", "2.4")}
  <p class="indent-p">{html.escape(THEORY_2_3_C)}</p>
  {eq_html("<i>C<sub>k</sub></i> = <i>P<sub>k</sub></i> &oplus; HMAC-SHA256(<i>K</i>, Nonce &#8741; <i>k</i>)", "2.5")}

  <!-- 3. EQUIPMENT -->
  <h1 class="ch-title">3. Equipment</h1>
  <ul class="clean-list">{equip_li}</ul>

  <!-- 4. PROCEDURE -->
  <h1 class="ch-title">4. Procedure</h1>
  {proc_p}
  {f1}

  <!-- 5. RESULTS -->
  <h1 class="ch-title">5. Results</h1>
  <h2 class="sec-title">5.1 Data in table format</h2>
  <p class="indent-p">
    Network diagnostic trials (<i>n</i> = 5 per host) were conducted from the Python server across loopback, local Wi-Fi LAN, and public DNS resolvers. The measured DNS resolution times, mean round-trip latencies, maximum latencies, and sample standard deviations calculated via Equation (2.2) are summarized in Table 1.
  </p>
  {t1}
  <p class="indent-p">
    Facial biometric authentication experiments (10 trials per level) were performed using the 192-dimensional zero-mean Sobel gradient descriptor defined in Equations (2.3) and (2.4). Table 2 presents the measured similarity scores across controlled structural deviations <i>&sigma;</i> and an unauthorized second subject (friend).
  </p>
  {t2}
  <p class="indent-p">
    Cryptographic key derivation latencies for PBKDF2-HMAC-SHA256 across increasing cycle counts and CIDR firewall packet evaluations are recorded in Table 3.
  </p>
  {t3}

  <h2 class="sec-title">5.2 Figures and graphs</h2>
  <p class="indent-p">
    Figure 2 illustrates the inverse linear decay of the 192-dimensional biometric similarity score <i>S</i> (%) as structural facial deviation <i>&sigma;</i> increases, crossing the 85.0% security threshold at <i>&sigma;</i> &approx; 0.38. Figure 3 compares measured PBKDF2-HMAC-SHA256 key derivation latency against a least-squares linear regression model. Figures 4 and 5 show the operational web interfaces of Po Second Brain.
  </p>
  {f2}
  {f3}
  {f4}
  {f5}

  <!-- 6. CONSIDERATION -->
  <h1 class="ch-title">6. Consideration</h1>
  <h2 class="sec-title">6.1 Discussions</h2>
  <p class="indent-p">
    First, the network telemetry results in Table 1 confirm clear physical-layer separation across network scopes. Loopback communication on <code>lo0</code> (127.0.0.1) achieved an average RTT of 0.06 ms with minimal jitter (<i>S.D.</i> = 0.01 ms) because packets bypass physical network interface hardware inside the macOS kernel. Private Wi-Fi LAN communication on <code>en0</code> (10.111.9.122) averaged 0.12 ms (<i>S.D.</i> = 0.02 ms), proving that iPhone Apple Health webhook synchronization and local Ollama inference introduce negligible transport overhead. By contrast, wide-area ICMP probes to 1.1.1.1 and 8.8.8.8 yielded mean RTTs of 6.74 ms (<i>S.D.</i> = 1.37 ms) and 9.31 ms (<i>S.D.</i> = 4.56 ms), reflecting multi-hop router queuing variance calculated via Equation (2.2).
  </p>
  <p class="indent-p">
    Second, during initial biometric testing, an un-centered 32-point positive luminance vector falsely accepted an unauthorized friend's face because strictly positive vectors under shared room lighting maintain raw cosine similarity above 90%. Replacing that prototype with the 192-dimensional zero-mean Z-score Sobel gradient and chromaticity descriptor in Equations (2.3) and (2.4) completely resolved this vulnerability. As shown in Table 2 and Figure 2, linear regression yields <i>y</i> = &minus;44.66<i>x</i> + 101.95 (<i>R</i><sup>2</sup> = 0.988): normal owner poses (<i>&sigma;</i> &le; 0.35) consistently scored between 87.8% and 99.2% (above the 85.0% threshold), whereas an unauthorized subject scored 54.0% (and 29.1% in cross-subject Sobel landmark tests), triggering immediate HTTP 401 rejection. Hiding the enrollment button on the locked modal further prevented unauthorized profile overwriting.
  </p>
  <p class="indent-p">
    Third, Figure 3 confirms that PBKDF2-HMAC-SHA256 key derivation time scales linearly with iteration count according to <i>y</i> = 0.2687<i>x</i> + 1.0720 (<i>R</i><sup>2</sup> = 0.999), corresponding to 0.2687 ms per 1,000 SHA-256 cycles on the Apple M2 processor. Selecting 100,000 iterations for vault key derivation requires 27.47 ms and 120,000 iterations for passcode verification requires 32.39 ms—imperceptible to a human user (&lt; 50 ms) while imposing a 1.2 &times; 10<sup>5</sup> computational cost multiplier against brute-force attacks.
  </p>

  <h2 class="sec-title">6.2 Questions</h2>
  <p class="indent-p">
    <strong>Question 1:</strong> Why does local Ollama (<code>127.0.0.1:11434</code>) require a Hybrid Cloud Router when the website is published to an external cloud server?<br/>
    <strong>Answer:</strong> In TCP/IP networking, <code>127.0.0.1</code> refers strictly to the loopback interface of the machine executing <code>server.py</code>. When deployed to a remote cloud container without GPU hardware, requests to <code>127.0.0.1:11434</code> fail with <code>ConnectionRefusedError</code>. The Hybrid AI Router detects this condition and routes the RAG prompt (with vault secrets redacted) to Groq Llama 3.3 70B or Google Gemini 2.5 Flash over HTTPS, preserving full Second Brain functionality anywhere.
  </p>
  <p class="indent-p">
    <strong>Question 2:</strong> Using Equation (2.1), compare the assignable host capacity of the firewall's Class C rule (<code>192.168.0.0/16</code>) versus the blocked test subnet (<code>203.0.113.0/24</code>).<br/>
    <strong>Answer:</strong> For <code>192.168.0.0/16</code> (<i>p</i> = 16), <i>H</i> = 2<sup>(32&minus;16)</sup> &minus; 2 = 2<sup>16</sup> &minus; 2 = 65,534 usable hosts. For <code>203.0.113.0/24</code> (<i>p</i> = 24), <i>H</i> = 2<sup>(32&minus;24)</sup> &minus; 2 = 2<sup>8</sup> &minus; 2 = 254 usable hosts. Thus, the <code>/16</code> private LAN rule covers 258 times more host addresses than a single <code>/24</code> subnet.
  </p>

  <h2 class="sec-title">6.3 Comments</h2>
  <p class="indent-p">
    Developing Po Second Brain provided practical, hands-on insight into combining local LLM inference (Ollama Qwen 2.5 7B), low-level socket networking, and biometric security within a single cohesive web architecture. Discovering and mathematically fixing the Face ID false-acceptance bug demonstrated the importance of zero-mean normalization and spatial gradient features in real-world authentication. For future enhancement, adding self-signed TLS (HTTPS) on the local LAN IP (<code>10.111.9.122</code>) would enable WebAuthn Touch ID passkeys across secondary devices on the same Wi-Fi network, and integrating infrared depth sensing would further harden liveness detection against printed photographs.
  </p>

  <!-- REFERENCES (24pt Bold centered per Section 2.8.1) -->
  <div class="ref-heading">References</div>
  {refs_html}

</body>
</html>
"""
    with open(OUT_HTML, "w", encoding="utf-8") as f:
        f.write(html_str)

    chrome_bin = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    subprocess.check_call(
        [
            chrome_bin,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            f"--print-to-pdf={OUT_PDF}",
            "file://" + OUT_HTML,
        ],
        stderr=subprocess.DEVNULL,
    )
    print("[OK] PDF generated:", OUT_PDF, os.path.getsize(OUT_PDF), "bytes")


# ==============================================================================
# 2. GENERATE NATIVE MICROSOFT WORD (.DOCX) FOLLOWING EVERY TEMPLATE SPEC
# ==============================================================================
def generate_docx():
    # Helper functions for OpenXML WordprocessingML
    def run_xml(text, bold=False, italic=False, size_pt=12, font="Times New Roman", jp=False):
        sz = int(size_pt * 2)
        rPr = f'<w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:cs="{font}" w:eastAsia="MS Mincho"/>'
        if bold:
            rPr += "<w:b/>"
        if italic:
            rPr += "<w:i/>"
        rPr += f'<w:sz w:val="{sz}"/><w:szCs w:val="{sz}"/></w:rPr>'
        return f'<w:r>{rPr}<w:t xml:space="preserve">{html.escape(text)}</w:t></w:r>'

    def para_xml(runs_str, align="both", space_before=0, space_after=120, first_indent=0, page_break_before=False):
        pPr = "<w:pPr>"
        if page_break_before:
            pPr += "<w:pageBreakBefore/>"
        pPr += f'<w:jc w:val="{align}"/>'
        pPr += f'<w:spacing w:before="{space_before}" w:after="{space_after}" w:line="300" w:lineRule="auto"/>'
        if first_indent:
            pPr += f'<w:ind w:firstLine="{first_indent}"/>'
        pPr += "</w:pPr>"
        return f"<w:p>{pPr}{runs_str}</w:p>"

    def blank_line():
        return para_xml(run_xml("", size_pt=12), align="left", space_before=0, space_after=0)

    def eq_row_xml(eq_text, eq_num):
        # 1 line space before and after, centered 11pt Cambria Math, right-aligned (x.y)
        return (
            blank_line()
            + f"""<w:tbl>
              <w:tblPr>
                <w:tblW w:w="5000" w:type="pct"/>
                <w:tblBorders>
                  <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/>
                  <w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/>
                </w:tblBorders>
              </w:tblPr>
              <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="750" w:type="pct"/></w:tcPr>{para_xml(run_xml("", size_pt=11), align="left", space_after=0)}</w:tc>
                <w:tc><w:tcPr><w:tcW w:w="3500" w:type="pct"/></w:tcPr>{para_xml(run_xml(eq_text, italic=True, size_pt=11, font="Cambria Math"), align="center", space_after=0)}</w:tc>
                <w:tc><w:tcPr><w:tcW w:w="750" w:type="pct"/></w:tcPr>{para_xml(run_xml(f"({eq_num})", size_pt=11, font="Times New Roman"), align="right", space_after=0)}</w:tc>
              </w:tr>
            </w:tbl>"""
            + blank_line()
        )

    def word_table_xml(headers, rows, col_pcts=None):
        # Pure white (#FFFFFF) background, 12pt Times New Roman, 1px black borders, fits 100% inside 1-inch margins
        if not col_pcts:
            col_pcts = [int(5000 / len(headers))] * len(headers)
        hdr_cells = ""
        for h, w in zip(headers, col_pcts):
            hdr_cells += f"""<w:tc>
              <w:tcPr><w:tcW w:w="{w}" w:type="pct"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/></w:tcPr>
              {para_xml(run_xml(h, bold=True, size_pt=12), align="center", space_before=40, space_after=40)}
            </w:tc>"""
        body_trs = f"<w:tr>{hdr_cells}</w:tr>"
        for r in rows:
            tds = ""
            for idx, (c, w) in enumerate(zip(r, col_pcts)):
                al = "left" if idx == 0 else "center"
                tds += f"""<w:tc>
                  <w:tcPr><w:tcW w:w="{w}" w:type="pct"/><w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/></w:tcPr>
                  {para_xml(run_xml(c, size_pt=12), align=al, space_before=40, space_after=40)}
                </w:tc>"""
            body_trs += f"<w:tr>{tds}</w:tr>"

        return f"""<w:tbl>
          <w:tblPr>
            <w:tblW w:w="5000" w:type="pct"/>
            <w:shd w:val="clear" w:color="auto" w:fill="FFFFFF"/>
            <w:tblBorders>
              <w:top w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:left w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:bottom w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:right w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:insideH w:val="single" w:sz="6" w:space="0" w:color="000000"/>
              <w:insideV w:val="single" w:sz="6" w:space="0" w:color="000000"/>
            </w:tblBorders>
          </w:tblPr>
          {body_trs}
        </w:tbl>"""

    def word_figure_xml(rId, doc_id, caption_num, caption_text, cx=5400000, cy=2880000):
        # 5400000 EMUs = 5.90 inches (< 6.27 inch printable A4 width inside 1-inch margins!)
        cap_align = "center" if len(caption_text) <= 78 else "left"
        img_p = f"""<w:p>
          <w:pPr><w:jc w:val="center"/><w:spacing w:before="60" w:after="60"/></w:pPr>
          <w:r>
            <w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
                <wp:extent cx="{cx}" cy="{cy}"/>
                <wp:docPr id="{doc_id}" name="Figure {doc_id}"/>
                <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                      <pic:nvPicPr><pic:cNvPr id="{doc_id}" name="fig_{doc_id}.png"/><pic:cNvPicPr/></pic:nvPicPr>
                      <pic:blipFill><a:blip r:embed="{rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
                      <pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing>
          </w:r>
        </w:p>"""
        cap_p = para_xml(run_xml(f"Figure {caption_num}. {caption_text}", size_pt=12), align=cap_align, space_before=20, space_after=60)
        return blank_line() + img_p + cap_p + blank_line()

    parts = []

    # --- COVER PAGE ---
    parts.append(para_xml(run_xml("2026電気工学入門実験 I", size_pt=20, jp=True), align="center", space_before=60, space_after=80))
    parts.append(para_xml(run_xml("Lab work VI for Electrical and Electronics Engineering", size_pt=14), align="center", space_after=240))
    parts.append(para_xml(run_xml("Subject: ", bold=True, size_pt=18) + run_xml(SUBJECT_TITLE, size_pt=18), align="left", space_after=180))
    parts.append(para_xml(run_xml(f"Student ID/Name: {STUDENT_LINE}", size_pt=12), align="left", space_after=140))

    # Date Table
    parts.append(
        word_table_xml(
            ["Item", "Day", "/", "Month", "/", "Year"],
            [
                ("提出日 Date of submission:", "04", "/", "Nov.", "/", "2026"),
                ("締切日 Due date:", "04", "/", "Nov.", "/", "2026"),
                ("最終受取日 Accepted date:", "", "/", "", "/", "2026"),
            ],
            col_pcts=[2400, 650, 250, 750, 250, 700],
        )
    )
    parts.append(para_xml(run_xml("Members of the Lab group グループメンバー", bold=True, size_pt=12), align="left", space_before=160, space_after=60))
    parts.append(para_xml(run_xml(f"Student ID/Name: {STUDENT_LINE} (Individual Project)", size_pt=12), align="left", space_after=160))

    parts.append(para_xml(run_xml("チェックリスト   รายการตรวจสอบ   Check list", bold=True, size_pt=12), align="center", space_after=80))
    parts.append(
        word_table_xml(
            ["Check by student", "by teachers", "Evaluation Item"],
            [
                ("✓", "", "Objectives (目的 วัตถุประสงค์)"),
                ("✓", "", "Explanation (説明 อธิบาย)"),
                ("✓", "", "Equipment (実験装置 อุปกรณ์)"),
                ("✓", "", "Equation(s) formula(s) (式 สมการ 単位 หน่วย)"),
                ("✓", "", "Data, Table, Graph (データ, 表, グラフ ข้อมูล, ตาราง, กราฟ)"),
                ("✓", "", "Consideration(s) (議論, 質問, コメント Discussions, Questions, and Comments)"),
                ("", "", "Need to resubmit (remarks: ______________________________)"),
            ],
            col_pcts=[900, 800, 3300],
        )
    )
    parts.append(
        para_xml(
            run_xml("GitHub Repository: ", bold=True, size_pt=11)
            + run_xml("https://github.com/67992023-cmd/po-second-brain", size_pt=11)
            + run_xml("  |  Local URL: http://localhost:3000", size_pt=11),
            align="left",
            space_before=160,
            space_after=60,
        )
    )

    # --- PAGE BREAK TO MAIN CONTENT (Page 1 starts numbering at bottom center) ---
    parts.append(para_xml(run_xml("1. Objective", bold=True, size_pt=14), align="left", space_before=0, space_after=100, page_break_before=True))
    parts.append(para_xml(run_xml(OBJECTIVE_TEXT, size_pt=12), align="both", first_indent=480))

    # --- 2. THEORY ---
    parts.append(para_xml(run_xml("2. Theory", bold=True, size_pt=14), align="left", space_before=180, space_after=100))
    parts.append(para_xml(run_xml("2.1 Retrieval-Augmented Generation (RAG) and Hybrid Local LLM Architecture", bold=True, size_pt=12), align="left", space_before=80, space_after=80))
    parts.append(para_xml(run_xml(THEORY_2_1, size_pt=12), align="both", first_indent=480))

    parts.append(para_xml(run_xml("2.2 IPv4 CIDR Subnetting and Network Latency Statistics", bold=True, size_pt=12), align="left", space_before=120, space_after=80))
    parts.append(para_xml(run_xml(THEORY_2_2_A, size_pt=12), align="both", first_indent=480))
    parts.append(eq_row_xml("H = 2^(32 − p) − 2", "2.1"))
    parts.append(para_xml(run_xml(THEORY_2_2_B, size_pt=12), align="both", first_indent=480))
    parts.append(eq_row_xml("S.D. = √[ ∑(t_i − t̄)² / (n − 1) ]", "2.2"))

    parts.append(para_xml(run_xml("2.3 Zero-Mean Facial Biometric Correlation and AES-CTR Cryptography", bold=True, size_pt=12), align="left", space_before=120, space_after=80))
    parts.append(para_xml(run_xml(THEORY_2_3_A, size_pt=12), align="both", first_indent=480))
    parts.append(eq_row_xml("r = ∑(x_i − x̄)(y_i − ȳ) / √[ ∑(x_i − x̄)² · ∑(y_i − ȳ)² ]", "2.3"))
    parts.append(para_xml(run_xml(THEORY_2_3_B, size_pt=12), align="both", first_indent=480))
    parts.append(eq_row_xml("S = 0.65 · r^1.35 + 0.35 · max(0, 1 − 0.38·MAE − 0.18·max(0, L_2 − 0.35))", "2.4"))
    parts.append(para_xml(run_xml(THEORY_2_3_C, size_pt=12), align="both", first_indent=480))
    parts.append(eq_row_xml("C_k = P_k ⊕ HMAC-SHA256(K, Nonce ∥ k)", "2.5"))

    # --- 3. EQUIPMENT ---
    parts.append(para_xml(run_xml("3. Equipment", bold=True, size_pt=14), align="left", space_before=180, space_after=100))
    for item in EQUIPMENT_ITEMS:
        parts.append(para_xml(run_xml("• " + item, size_pt=12), align="both", space_after=60))

    # --- 4. PROCEDURE ---
    parts.append(para_xml(run_xml("4. Procedure", bold=True, size_pt=14), align="left", space_before=180, space_after=100))
    for step in PROCEDURE_STEPS:
        parts.append(para_xml(run_xml(step, size_pt=12), align="both", first_indent=360, space_after=80))
    parts.append(word_figure_xml("rIdFig1", 1, 1, "Block schematic and network topology of the Po Second Brain system.", cx=5400000, cy=2640000))

    # --- 5. RESULTS ---
    parts.append(para_xml(run_xml("5. Results", bold=True, size_pt=14), align="left", space_before=180, space_after=100))
    parts.append(para_xml(run_xml("5.1 Data in table format", bold=True, size_pt=12), align="left", space_before=80, space_after=80))
    parts.append(
        para_xml(
            run_xml(
                "Network diagnostic trials (n = 5 per host) were conducted across loopback, local Wi-Fi LAN, and public DNS resolvers. The measured DNS lookup times, mean round-trip latencies, maximum latencies, and sample standard deviations calculated via Equation (2.2) are shown in Table 1.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )

    parts.append(blank_line())
    parts.append(
        para_xml(
            run_xml("Table 1 ", bold=True, size_pt=12)
            + run_xml("Network latency and DNS resolution measurements across loopback, private LAN, and public DNS hosts", size_pt=12),
            align="left",
            space_after=40,
        )
    )
    parts.append(
        word_table_xml(
            ["Target Network Node", "IPv4 Address", "DNS (ms)", "Avg RTT (ms)", "Max RTT (ms)", "RTT S.D. (ms)"],
            TABLE_1_ROWS,
            col_pcts=[1400, 900, 650, 700, 700, 650],
        )
    )
    parts.append(blank_line())

    parts.append(
        para_xml(
            run_xml(
                "Facial biometric authentication trials (10 trials per perturbation level) were evaluated using the 192-dimensional zero-mean Sobel gradient mesh in Equations (2.3) and (2.4), as recorded in Table 2.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )
    parts.append(blank_line())
    parts.append(
        para_xml(
            run_xml("Table 2 ", bold=True, size_pt=12)
            + run_xml("Biometric verification similarity scores and authentication decisions across structural deviations", size_pt=12),
            align="left",
            space_after=40,
        )
    )
    parts.append(
        word_table_xml(
            ["Test Condition / Subject", "Deviation σ", "Mean Score S (%)", "Score S.D. (%)", "Access Control Result"],
            TABLE_2_ROWS,
            col_pcts=[1500, 750, 900, 800, 1050],
        )
    )
    parts.append(blank_line())

    parts.append(
        para_xml(
            run_xml(
                "Cryptographic PBKDF2-HMAC-SHA256 key derivation benchmarks and IPv4 CIDR firewall simulation results are presented in Table 3.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )
    parts.append(blank_line())
    parts.append(
        para_xml(
            run_xml("Table 3 ", bold=True, size_pt=12)
            + run_xml("PBKDF2-HMAC-SHA256 key derivation latency and IPv4 CIDR firewall simulation results", size_pt=12),
            align="left",
            space_after=40,
        )
    )
    parts.append(
        word_table_xml(
            ["Iterations (×10³)", "Latency T (ms)", "Simulated Source IP", "Matched CIDR Rule", "Firewall Action"],
            TABLE_3_ROWS,
            col_pcts=[900, 850, 1050, 1050, 1150],
        )
    )
    parts.append(blank_line())

    # --- 5.2 FIGURES AND GRAPHS ---
    parts.append(para_xml(run_xml("5.2 Figures and graphs", bold=True, size_pt=12), align="left", space_before=120, space_after=80))
    parts.append(
        para_xml(
            run_xml(
                "Figure 2 presents the relationship between structural facial deviation σ and the 192-dimensional biometric similarity score S (%). Figure 3 compares measured PBKDF2-HMAC-SHA256 key derivation latency against the linear regression model. Figures 4 and 5 display the implemented light-mode web interfaces.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )
    parts.append(word_figure_xml("rIdFig2", 2, 2, "The relationship between structural perturbation deviation and biometric similarity score.", cx=5400000, cy=2884000))
    parts.append(word_figure_xml("rIdFig3", 3, 3, "The comparison of PBKDF2 key derivation latency between measurement and linear regression model.", cx=5400000, cy=2884000))
    parts.append(word_figure_xml("rIdFig4", 4, 4, "Implemented Overview Summary interface with Apple Health rings and Ollama Qwen 2.5 7B.", cx=5300000, cy=3750000))
    parts.append(word_figure_xml("rIdFig5", 5, 5, "Implemented IP, network interface inspector, ICMP/DNS probe, and CIDR firewall lab.", cx=5300000, cy=3820000))

    # --- 6. CONSIDERATION ---
    parts.append(para_xml(run_xml("6. Consideration", bold=True, size_pt=14), align="left", space_before=180, space_after=100))
    parts.append(para_xml(run_xml("6.1 Discussions", bold=True, size_pt=12), align="left", space_before=80, space_after=80))
    parts.append(
        para_xml(
            run_xml(
                "First, the network telemetry measurements in Table 1 demonstrate clear physical-layer separation across network scopes. Loopback traffic on lo0 (127.0.0.1) achieved an average RTT of 0.06 ms (S.D. = 0.01 ms) because packets remain inside the macOS kernel socket buffer. Private Wi-Fi LAN communication on en0 (10.111.9.122) averaged 0.12 ms (S.D. = 0.02 ms), confirming minimal latency for iPhone Apple Health webhook synchronization and local Ollama inference. Conversely, wide-area ICMP probes to 1.1.1.1 and 8.8.8.8 produced mean RTTs of 6.74 ms (S.D. = 1.37 ms) and 9.31 ms (S.D. = 4.56 ms), reflecting multi-hop router queuing variance calculated via Equation (2.2).",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )
    parts.append(
        para_xml(
            run_xml(
                "Second, during initial biometric testing, an un-centered 32-point positive luminance vector falsely accepted an unauthorized friend's face because strictly positive vectors under identical room illumination yield raw cosine similarity above 90%. Upgrading to the 192-dimensional zero-mean Z-score Sobel gradient and chromaticity descriptor in Equations (2.3) and (2.4) eliminated false acceptance. As shown in Table 2 and Figure 2, linear regression yields y = −44.66x + 101.95 (R² = 0.988): normal owner poses (σ ≤ 0.35) scored 87.8%–99.2% (above the 85.0% threshold), whereas an unauthorized subject scored 54.0% (and 29.1% in cross-subject Sobel tests), resulting in HTTP 401 rejection. Hiding the enrollment button on the locked modal also prevented unauthorized profile overwriting.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )
    parts.append(
        para_xml(
            run_xml(
                "Third, Figure 3 confirms that PBKDF2-HMAC-SHA256 key derivation latency scales linearly with iteration count according to y = 0.2687x + 1.0720 (R² = 0.999), or 0.2687 ms per 1,000 SHA-256 cycles on Apple M2 silicon. Choosing 100,000 iterations for vault key derivation (27.47 ms) and 120,000 iterations for passcode authentication (32.39 ms) keeps login latency below 35 ms while substantially increasing offline brute-force resistance.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )

    parts.append(para_xml(run_xml("6.2 Questions", bold=True, size_pt=12), align="left", space_before=120, space_after=80))
    parts.append(
        para_xml(
            run_xml("Question 1: ", bold=True, size_pt=12)
            + run_xml(
                "Why does local Ollama (127.0.0.1:11434) require a Hybrid Cloud Router when published to an external cloud server? Answer: In TCP/IP networking, 127.0.0.1 binds strictly to the loopback interface of the host executing server.py. On a remote cloud server without local Ollama weights, requests to 127.0.0.1:11434 fail with ConnectionRefusedError. The Hybrid AI Router detects this condition and routes the redacted RAG prompt over HTTPS to Groq Llama 3.3 70B or Google Gemini 2.5 Flash.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )
    parts.append(
        para_xml(
            run_xml("Question 2: ", bold=True, size_pt=12)
            + run_xml(
                "Using Equation (2.1), compare the assignable host capacity of the firewall's Class C private rule (192.168.0.0/16) versus the blocked test subnet (203.0.113.0/24). Answer: For p = 16, H = 2^(32−16) − 2 = 65,534 usable hosts. For p = 24, H = 2^(32−24) − 2 = 254 usable hosts, making the /16 private rule 258 times larger in host capacity.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )

    parts.append(para_xml(run_xml("6.3 Comments", bold=True, size_pt=12), align="left", space_before=120, space_after=80))
    parts.append(
        para_xml(
            run_xml(
                "Designing and building Po Second Brain was highly rewarding because it connected networking fundamentals (IPv4 CIDR masking, DNS/ICMP latency, LAN webhooks) with modern local LLM engineering (Ollama Qwen 2.5 7B) and cryptographic security. Discovering and mathematically resolving the Face ID false-acceptance vulnerability highlighted why zero-mean normalization and spatial edge gradients are essential in biometric systems. Future work can incorporate local HTTPS TLS certificates to support cross-device WebAuthn passkeys over Wi-Fi LAN.",
                size_pt=12,
            ),
            align="both",
            first_indent=480,
        )
    )

    # --- REFERENCES (24pt Bold centered per Section 2.8.1) ---
    parts.append(para_xml(run_xml("References", bold=True, size_pt=24), align="center", space_before=280, space_after=180))
    for ref in REFERENCES:
        parts.append(para_xml(run_xml(ref, size_pt=12), align="left", space_after=80))

    # Footer XML: Bottom center page number in Times New Roman 10pt (20 half-pts)
    footer1_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:fldSimple w:instr="PAGE">
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
              <w:sz w:val="20"/><w:szCs w:val="20"/>
            </w:rPr>
            <w:t>1</w:t>
          </w:r>
        </w:fldSimple>
      </w:p>
    </w:ftr>"""

    # Empty first-page footer so Cover Page has NO page number printed, while pages are still counted
    footer_first_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:p><w:pPr><w:jc w:val="center"/></w:pPr></w:p>
    </w:ftr>"""

    # A4 Page Size: w=11906 twips (210mm), h=16838 twips (297mm)
    # 1 inch (25.4mm) Margins all around: top=1440, right=1440, bottom=1440, left=1440 twips
    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <w:body>
        {"".join(parts)}
        <w:sectPr>
          <w:footerReference w:type="default" r:id="rIdFooterDefault"/>
          <w:footerReference w:type="first" r:id="rIdFooterFirst"/>
          <w:pgSz w:w="11906" w:h="16838"/>
          <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
          <w:titlePg/>
        </w:sectPr>
      </w:body>
    </w:document>"""

    doc_rels_xml = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>',
        '<Relationship Id="rIdFooterDefault" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>',
        '<Relationship Id="rIdFooterFirst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer_first.xml"/>',
    ]
    for idx, (mname, _) in enumerate(MEDIA, start=1):
        doc_rels_xml.append(f'<Relationship Id="rIdFig{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/{mname}"/>')
    doc_rels_xml.append("</Relationships>")

    content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
      <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
      <Default Extension="xml" ContentType="application/xml"/>
      <Default Extension="png" ContentType="image/png"/>
      <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
      <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
      <Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
      <Override PartName="/word/footer_first.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>
    </Types>"""

    root_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
      <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
    </Relationships>"""

    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:docDefaults>
        <w:rPrDefault>
          <w:rPr>
            <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="MS Mincho"/>
            <w:sz w:val="24"/><w:szCs w:val="24"/>
          </w:rPr>
        </w:rPrDefault>
      </w:docDefaults>
    </w:styles>"""

    with zipfile.ZipFile(OUT_DOCX, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml)
        zf.writestr("_rels/.rels", root_rels_xml)
        zf.writestr("word/document.xml", document_xml)
        zf.writestr("word/styles.xml", styles_xml)
        zf.writestr("word/footer1.xml", footer1_xml)
        zf.writestr("word/footer_first.xml", footer_first_xml)
        zf.writestr("word/_rels/document.xml.rels", "".join(doc_rels_xml))
        for mname, mpath in MEDIA:
            zf.write(mpath, f"word/media/{mname}")

    print("[OK] Word (.docx) generated:", OUT_DOCX, os.path.getsize(OUT_DOCX), "bytes")


if __name__ == "__main__":
    generate_pdf()
    generate_docx()
