# PhysioFlow beta.24：研究試用

2026-10-14。Python 3 と Chrome / Edge を用意し、解凍後にOSに対応するstartスクリプトを実行してください。index.html を直接開かず、データフォルダーを選び、説明・刺激・評価の短い実験で編集、実行、保存、再表示、エクスポートを確認してください。

同梱の実験設計は210ノードです。40動画の実データは同梱しません。Git LFSポインターは再生可能な映像ではありません。USER_TRIAL_日本語.md の手順で実際の試用結果を記録してください。

DB連携は更新したPFソースで uv sync --frozen --project tools/physiodb、npm run build、npm run desk を実行し、サーバ側で各利用者の認証情報を設定します。静的Web包だけではDB連携は動きません。別Originから接続する場合はPFサーバの許可Origin設定が必要です。管理者キー・DBトークンは参加者に渡しません。

現在正式な機器はなく、前輩コードのmockとBrainFlow Syntheticで確認しています。実機と実際の刺激・時間の確認は別途必要です。更新前にデータをバックアップしてください。旧beta.8パッケージと動画は保持します。

実験員向けの追加操作は OPERATOR_GUIDE_日本語.md を参照してください。
