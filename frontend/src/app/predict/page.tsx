import { readFileSync } from "node:fs";
import { join } from "node:path";
import { AppHeader } from "@/components/AppHeader";
import { DataNotice } from "@/components/DataNotice";
import { PredictForm } from "@/components/PredictForm";
import { getCustomers, isMockMode } from "@/lib/api";

function getTwoBandCutoff() {
  if (isMockMode()) return null;
  const { threshold } = JSON.parse(readFileSync(join(process.cwd(), "..", "ai/evaluation/model_meta.json"), "utf8")) as {
    threshold: { bands: { high: number; medium: number } };
  };
  return threshold.bands.high === threshold.bands.medium ? threshold.bands.high : null;
}

export default async function PredictPage() {
  const cutoff = getTwoBandCutoff();
  const threshold = cutoff === null ? null : new Intl.NumberFormat("vi-VN", {
    style: "percent", maximumFractionDigits: 2,
  }).format(cutoff);
  const { items, dataset_notice } = await getCustomers({ page: 1, page_size: 100 });
  return <main className="dashboard-shell"><AppHeader current="predict" /><div className="dashboard-content">
    <p className="eyebrow">SUY LUẬN / PREDICTION</p>
    <div className="title-row"><div><h1>Thử dự đoán</h1><p className="subtitle">Gửi một snapshot đến API và xem score, nhãn rủi ro cùng tín hiệu giải thích khi mô hình sẵn sàng.</p></div></div>
    <DataNotice notice={dataset_notice} />
    {threshold !== null && <p className="source-note">Điểm từ {threshold} trở lên thuộc mức rủi ro cao. Điểm dưới {threshold} thuộc mức thấp. Ngưỡng được chọn trên tập validation.</p>}
    <PredictForm examples={items} />
  </div></main>;
}
