import Link from "next/link";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AppHeader } from "@/components/AppHeader";
import { isMockMode } from "@/lib/api";

type BenchmarkTest = { pr_auc: number; roc_auc: number; precision: number; recall: number };
type Comparison = { name: string; feature_set: string; test_pr_auc: number; test_roc_auc: number; test_precision: number; test_recall: number };

// Read tracked aggregate artifacts on the server. No customer-level data or
// model binary enters the browser bundle, and a research rerun stays current.
function result<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "..", relativePath), "utf8")) as T;
}

const statistics = result<{ tests: { n: number; p_value: number; ci_low: number; ci_high: number; effect_size: number }[] }>("research/statistics/results.json");
const ols = result<{ split: { training_rows: number; test_rows: number }; models: { multiple: { r_squared: number; test_rmse: number; test_negative_predictions: number } } }>("research/regression/results/ols_results.json");
const logit = result<{ test: { n: number; positive_support: number; pr_auc_average_precision: number; roc_auc: number; recall: number; threshold: number } }>("research/regression/results/logit_results.json");
const forecast = result<{ n_mature_weeks: number; test_metrics: { selected: { n: number; mae: number; rmse: number } } }>("research/forecasting/analysis_manifest.json");
const tree = result<{ test: BenchmarkTest }>("research/baselines/decision_tree_results.json");
const naiveBayes = result<{ test: BenchmarkTest }>("research/baselines/gaussian_nb_results.json");
const evaluation = result<{ comparison: Comparison[] }>("ai/evaluation/metrics.json");

type SplitCounts = { rows: number; positives: number };
const { splits } = result<{ splits: Record<"train" | "validation" | "test", SplitCounts> }>("ai/evaluation/split_manifest.json");
const { selected_model: selectedModel } = result<{ selected_model: { name: string } }>("ai/evaluation/run_summary.json");

const candidates = [
  { key: "majority", label: "Mức nền không kỹ năng", kind: "Mốc so sánh", detail: "Luôn dự đoán theo tỷ lệ lớp Ghost trong tập huấn luyện. PR-AUC trên test xấp xỉ tỷ lệ Ghost trong tập test." },
  { key: "rule_eds", label: "Luật EDS", kind: "Luật hành vi", detail: "Điểm từ quy tắc giảm tương tác; là baseline mạnh hơn mức tỷ lệ lớp nhưng chưa phải mô hình học máy được phục vụ." },
  { key: "decision_tree", label: "Decision Tree · Thành", kind: "Benchmark", detail: "Cây quyết định nông, chọn độ sâu và lá tối thiểu trên validation. Dễ giải thích nhưng xác suất có thể chưa hiệu chuẩn." },
  { key: "gaussian_nb", label: "Gaussian Naive Bayes · Lâm", kind: "Benchmark", detail: "Mô hình xác suất đơn giản. Giả định phân phối Gaussian và độc lập có điều kiện có thể không hợp với số đếm sự kiện lệch." },
  { key: "logistic_regression", label: "Logistic Regression · ML", kind: "Phân loại", detail: "Phân loại Ghost so với Active trên cùng tập test. Đây là bài toán khác logistic suy luận Ghost so với tất cả trạng thái đủ nhãn ở phần trên." },
  { key: "random_forest", label: "Random Forest", kind: "Phân loại", detail: "Tập hợp nhiều cây. Mô hình được chọn trên validation trước khi đánh giá trên test." },
  { key: "xgboost", label: "XGBoost", kind: "Phân loại", detail: "Boosting trên đặc trưng trước T. Điểm xếp hạng test là kết quả nghiên cứu; form dự đoán dùng mô hình được chọn trên validation." },
  { key: "xgboost+platt", label: "XGBoost + Platt · Kiệt", kind: "Hiệu chuẩn", detail: "XGBoost được hiệu chuẩn Platt bằng dự đoán out-of-fold trên train. Ngưỡng được chọn trên validation theo giả định chi phí." },
  { key: "svm_rbf", label: "SVM RBF", kind: "Mô hình bổ sung", detail: "So sánh khả năng xếp hạng bằng kernel RBF. Đầu ra ở đây không được báo cáo như xác suất đã hiệu chuẩn." },
  { key: "isolation_forest", label: "Isolation Forest", kind: "Mô hình bổ sung", detail: "Phát hiện bất thường không giám sát; được đánh giá trên cùng tập test, không phải model được phục vụ." },
] as const;

const percent = (value: number) => `${(value * 100).toFixed(1).replace(".", ",")}%`;
const decimal = (value: number) => value.toFixed(3).replace(".", ",");
const integer = (value: number) => new Intl.NumberFormat("vi-VN").format(value);
const test = statistics.tests[0];
const selectedForecast = forecast.test_metrics.selected;
const fullXgboost = evaluation.comparison.find(
  (item) => item.name === "xgboost" && item.feature_set === "full",
);
const observationOnly = evaluation.comparison.find(
  (item) => item.name === "ablation:xgboost" && item.feature_set === "observation_only",
);

export default function AlgorithmsPage() {
  return <main className="dashboard-shell"><AppHeader current="algorithms" /><div className="dashboard-content">
    <p className="eyebrow">NGHIÊN CỨU / ALGORITHMS</p>
    <div className="title-row"><div><h1>Thuật toán đã chạy</h1><p className="subtitle">Kết quả tổng hợp từ các artifact nghiên cứu. Bấm từng thuật toán để xem ý nghĩa và giới hạn.</p></div></div>
    {isMockMode() ? <section className="empty-panel"><h2>Chỉ hiển thị ở real mode</h2><p>Đặt NEXT_PUBLIC_API_MODE=real và khởi động lại website để đối chiếu với API dữ liệu thật.</p></section> : <>
      <div className="notice" role="status"><strong>Dữ liệu Retailrocket thật · thiết kế 4+2+4.</strong><span>Các bảng là kết quả đã tính, không huấn luyện lại khi bấm. Mỗi bài toán có tập đánh giá khác nhau.</span></div>
      <nav className="algorithm-jumps" aria-label="Đi tới nhóm thuật toán">
        <a href="#thong-ke">1. Kiểm định và hồi quy</a>
        <a href="#du-bao">2. Dự báo</a>
        <a href="#phan-loai">3. Phân loại</a>
        <a href="#gioi-han">4. Giới hạn</a>
      </nav>

      <section id="thong-ke" className="analytics-section"><p className="section-kicker">RQ1–RQ2</p><h2>Kiểm định và hồi quy</h2>
        <div className="algorithm-grid">
          <details className="algorithm-card"><summary>Welch t-test <span>So recency Ghost–Active</span></summary><p>Mỗi visitor góp một snapshot đủ nhãn mới nhất: N = {integer(test.n)}. CI 95% cho chênh lệch recency trung bình [{test.ci_low.toFixed(2).replace(".", ",")}; {test.ci_high.toFixed(2).replace(".", ",")}] ngày, p = {test.p_value.toExponential(2).replace(".", ",")}, Cohen d = {test.effect_size.toFixed(2).replace(".", ",")}.</p><p>Đây là liên hệ quan sát, không phải tác động nhân quả. <Link href="/statistics">Xem biểu đồ và bảng kiểm định →</Link></p></details>
          <details className="algorithm-card"><summary>OLS nhiều biến <span>Dự đoán phiên/tuần</span></summary><p>Train {integer(ols.split.training_rows)} hàng, test {integer(ols.split.test_rows)} hàng; R² train {decimal(ols.models.multiple.r_squared)}, RMSE test {decimal(ols.models.multiple.test_rmse)} phiên/tuần.</p><p>{integer(ols.models.multiple.test_negative_predictions)} dự đoán test bị âm. OLS phục vụ phân tích, chưa phù hợp để triển khai dự báo số đếm.</p></details>
          <details className="algorithm-card"><summary>Logistic suy luận <span>Ghost so với trạng thái khác</span></summary><p>Test {integer(logit.test.n)} snapshot đủ nhãn, trong đó {integer(logit.test.positive_support)} Ghost. PR-AUC {decimal(logit.test.pr_auc_average_precision)}, ROC-AUC {decimal(logit.test.roc_auc)}; recall {percent(logit.test.recall)} tại ngưỡng {decimal(logit.test.threshold)}.</p><p>Tập này khác bài toán Ghost–Active ở bảng phân loại. Recall thấp nên không dùng mô hình này để cảnh báo.</p></details>
        </div>
      </section>

      <section id="du-bao" className="analytics-section"><p className="section-kicker">RQ4</p><h2>Dự báo chuỗi tuần</h2>
        <details className="algorithm-card"><summary>Last mature value · naive <span>{forecast.n_mature_weeks} tuần có nhãn chín</span></summary><p>Giữ tỷ lệ tuần chín gần nhất để dự báo hai tuần tiếp theo. {selectedForecast.n} mốc backtest cho MAE {decimal(selectedForecast.mae * 100)} điểm phần trăm, RMSE {decimal(selectedForecast.rmse * 100)} điểm phần trăm.</p><p>Chuỗi quá ngắn để chọn ARIMA ổn định; hai điểm dự báo không có khoảng tin cậy. <Link href="/forecast">Xem biểu đồ dự báo →</Link></p></details>
      </section>

      <section id="phan-loai" className="analytics-section"><p className="section-kicker">RQ3 · TEST CHUNG</p><h2>Phân loại Ghost so với Active</h2>
        <p>Split tách visitor và thời gian: train {integer(splits.train.rows)}, validation {integer(splits.validation.rows)}, test {integer(splits.test.rows)} snapshot ({integer(splits.test.positives)} Ghost). Tập test chỉ gồm một tuần. Bảng chỉ lấy kết quả test; PR-AUC cao hơn là xếp hạng nhãn vận hành tốt hơn trên mẫu này.</p>
        <div className="table-scroll"><table className="customer-table analytics-table"><thead><tr><th>Thuật toán</th><th>Vai trò</th><th className="numeric">PR-AUC</th><th className="numeric">ROC-AUC</th><th className="numeric">Precision</th><th className="numeric">Recall</th></tr></thead><tbody>{candidates.map((candidate) => {
          const row = candidate.key === "decision_tree" ? tree.test : candidate.key === "gaussian_nb" ? naiveBayes.test : evaluation.comparison.find((item) => item.name === candidate.key && item.feature_set === "full");
          if (!row) return null;
          const pr = "pr_auc" in row ? row.pr_auc : row.test_pr_auc;
          const roc = "roc_auc" in row ? row.roc_auc : row.test_roc_auc;
          const precision = "precision" in row ? row.precision : row.test_precision;
          const recall = "recall" in row ? row.recall : row.test_recall;
          return <tr key={candidate.key}><td><strong>{candidate.label}</strong></td><td>{candidate.kind}</td><td className="numeric">{decimal(pr)}</td><td className="numeric">{decimal(roc)}</td><td className="numeric">{decimal(precision)}</td><td className="numeric">{decimal(recall)}</td></tr>;
        })}</tbody></table></div>
        <div className="algorithm-grid algorithm-details">{candidates.map((candidate) => <details className="algorithm-card" key={candidate.key}><summary>{candidate.label}<span>{candidate.kind}</span></summary><p>{candidate.detail}</p></details>)}</div>
        <p className="source-note">Mô hình {selectedModel.name} chạy trên trang <Link href="/predict">Dự đoán</Link>. <Link href="/models">Xem thêm confusion matrix và calibration →</Link></p>
      </section>

      <section id="gioi-han" className="analytics-section"><p className="section-kicker">KIỂM TRA ĐỘ TIN CẬY</p><h2>Điểm cao phụ thuộc lịch sử nền</h2>
        <p>XGBoost đầy đủ đạt test PR-AUC {fullXgboost ? decimal(fullXgboost.test_pr_auc) : "—"}. Khi chỉ giữ 10 biến ở giai đoạn quan sát gần T, PR-AUC còn {observationOnly ? decimal(observationOnly.test_pr_auc) : "—"}. Nhãn Ghost dùng tỷ lệ so với hoạt động nền, nên điểm đầy đủ không chứng minh một tín hiệu cảnh báo độc lập mạnh.</p>
        <p>Event log không cung cấp mô hình đo lường biến tiềm ẩn để công bố SEM có cơ sở. Nhóm chưa khẳng định đã hoàn thành SEM hoặc ARIMA.</p>
      </section>
    </>}
  </div></main>;
}
