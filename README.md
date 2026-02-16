# ⚙️ Steampunk Skies - 蒸気空戦記

**スチームパンク風 縦スクロール弾幕シューティングゲーム**

[![Play Now](https://img.shields.io/badge/🎮_Play_Now-GitHub_Pages-blue?style=for-the-badge)](https://k3peta.github.io/SteampunkSkies/)

---

## 🎮 遊び方

### キーボード操作
| キー | アクション |
|------|---------|
| ← → ↑ ↓ / WASD | 移動 |
| Z | ショット（押しっぱなしで連射） |
| X | ボム（画面全体攻撃） |
| Shift | 低速移動（精密操作） |
| Enter | 決定 |
| Escape | ポーズ |

### スマートフォン操作
- **左側**: バーチャルジョイスティック（タッチ＆ドラッグで移動）
- **右側**: FIRE / BOMB / SLOW ボタン

---

## ✨ 特徴

- 🏭 **スチームパンクの世界観** — 歯車、蒸気、真鍮の機械たちが織りなす空中戦
- 🎵 **全曲リアルタイム生成BGM** — Web Audio APIによるEurobeatスタイルBGM、ステージ進行で盛り上がる4段階の強度変化
- 💥 **迫力の弾幕パターン** — 各ボスごとに異なる弾幕パターン
- 🛡️ **バリアシステム** — ダメージを1回吸収する防御アイテム
- 🔊 **フルサウンドエフェクト** — 爆発、ショット、サイレンまで全てプロシージャル生成
- 📱 **モバイル対応** — スマートフォンのタッチ操作に完全対応
- 🎨 **7つの個性的なステージ** — 市街地、大聖堂、港湾、時計塔都市、工業地帯、空中都市、機械神殿
- 👾 **巨大ボス戦** — 各ステージに中ボス＋ボス、撃破時の墜落演出

---

## 🕹️ ゲームシステム

### パワーアップ
- **P（青）** — ショットパワーアップ（最大5段階）
- **B（橙）** — ボム追加
- **S（黄）** — スコアアイテム
- **🛡（黄緑）** — バリア（最大3重）

### 難易度
4段階の難易度を選べます：
- **EASY** — 初めての方に
- **NORMAL** — 標準的な難易度
- **HARD** — 腕試しに
- **INSANE** — 弾幕の嵐

---

## 🛠️ 技術仕様

- **Pure HTML5 + JavaScript** — フレームワーク不使用
- **Canvas 2D** — 全描画
- **Web Audio API** — BGM・SE全てプロシージャル生成（音声ファイル不要）
- **ゼロ依存** — 外部ライブラリなし（Google Fontsのみ）
- **~60KB** — 超軽量（画像・音声ファイルなし）

---

## 📦 ローカルで実行

```bash
# リポジトリをクローン
git clone https://github.com/k3peta/SteampunkSkies.git
cd steampunk-shooter

# 任意のHTTPサーバーで起動（例）
npx serve .
# or
python -m http.server 8080
```

ブラウザで `http://localhost:8080` を開いてください。

---

## 📄 License

MIT License

---

<p align="center">
  <strong>⚙️ Built with gears, steam, and Web Audio API ⚙️</strong>
</p>
