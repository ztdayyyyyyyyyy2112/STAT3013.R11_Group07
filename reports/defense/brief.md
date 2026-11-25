# Ghost Customer Prediction

## Bản tóm tắt nội bộ — cập nhật theo 4+2+4

**Tình trạng:** Bản nghiên cứu và demo chạy trên dữ liệu Retailrocket thật. Các số liệu dưới đây theo thiết lập làm việc 4+2+4; cohort, nhãn, split và SEM vẫn cần nhóm phê duyệt. Đây là kết quả khám phá theo nhãn vận hành, không phải churn đã xác thực. Bảng số cũ trong bản thảo 4+2+2 không dùng chung với các kết quả dưới đây.

### Câu trả lời mở đầu trong 30 giây

Nhóm phân tích dấu hiệu giảm tương tác của khách truy cập thương mại điện tử. Từ 2.756.101 sự kiện Retailrocket, nhóm tạo snapshot hằng tuần; đặc trưng chỉ dùng hành vi trước thời điểm T, còn nhãn Ghost dựa trên 4 tuần xác nhận sau T so với baseline của visitor. Chúng tôi thực hiện thống kê, hồi quy, dự báo tỷ lệ Ghost và so sánh các mô hình phân loại. Demo web hiển thị dữ liệu đã xử lý và dự đoán. Ghost là nhãn vận hành của nghiên cứu, không chứng minh khách hàng đã rời bỏ cửa hàng.

### 12 ý chính cho slide

1. **Vấn đề:** Cần nhận biết visitor có khả năng giảm tương tác sau T. Không có nhãn churn thật hay danh tính khách hàng đã xác minh.
2. **Nguồn:** Retailrocket Kaggle v2, 2.756.101 sự kiện, SHA-256 của `events.csv` là `3745aa83…cfecbf9e7`; file gốc không được đưa lên Git. Cần ghi công nguồn và tuân thủ giấy phép CC BY-NC-SA 4.0.
3. **Thiết kế thời gian:** Baseline 4 tuần, observation 2 tuần trước T, confirmation 4 tuần sau T. Đặc trưng kết thúc trước T. Horizon chưa đủ quan sát là `unknown`, không gán bằng 0.
4. **Cohort:** 97.489 snapshot đủ lịch sử, trong đó 72.711 có nhãn chín và 24.778 bị right-censored/unknown. Nhãn chín gồm 5.810 Ghost, 8.405 Active, 56.374 Inactive và 2.122 Recovered. Đây là snapshot lặp visitor, không phải số khách hàng độc lập.
5. **Thống kê mô tả và suy luận:** Bảng mô tả có N và missingness theo nhãn. Welch dùng snapshot chín mới nhất của mỗi visitor, sau đó lọc Ghost/Active: 1.271 Ghost, 1.008 Active. Recency trước T của Ghost cao hơn 11,53 ngày; KTC 95% [10,89; 12,17], p = 1,44 × 10⁻²⁰⁶, Cohen d = 1,37. Đây là liên hệ quan sát, không phải tác động nhân quả.
6. **Hồi quy tuyến tính:** Kết quả là số phiên/tuần trong 4 tuần xác nhận. Mô hình nhiều biến có 29.290 hàng train (12.412 visitor) và 12.915 hàng test; R² = 0,372, RMSE test = 0,718. Hệ số `feature_sessions_4w` là 0,118 [0,094; 0,141]. OLS dự đoán âm cho 4.047 hàng test dù số phiên không âm; đây là giới hạn rõ ràng của mô hình.
7. **Logistic suy luận:** Ghost so với mọi trạng thái chín khác, khác bài toán Ghost-versus-Active của AI. Test có 5.816 hàng, 386 Ghost (6,64%). PR-AUC 0,156; ROC-AUC 0,671. Với ngưỡng validation 0,10, precision 0,148 và recall 0,373; kết quả còn yếu cho quyết định cảnh báo.
8. **Dự báo:** Chỉ có 10 điểm tỷ lệ Ghost theo tuần đã chín. Baseline giữ tỷ lệ chín gần nhất có 2 mốc backtest: MAE 0,00828, RMSE 0,00841 trên thang tỷ lệ. Hai dự báo khám phá cho 21 và 28/9 đều là 8,63%; không có khoảng dự báo. Không đủ chuỗi để chọn ARIMA đáng tin cậy.
9. **Model phân loại Ghost so với Active:** Split thời gian và visitor có purge nhãn; train 1.510, validation 352, test 330 hàng, với 153 Ghost ở test. XGBoost + Platt có PR-AUC 0,9097 [0,8696; 0,9391]. Decision Tree đạt 0,8944, Gaussian NB 0,8076; baseline PR-AUC 0,4636. Test chỉ là một tuần chín và còn nhỏ.
10. **Kiểm tra vòng lặp định nghĩa nhãn:** Với XGBoost, bỏ các thành phần baseline được đặt tên nhưng giữ cửa sổ chồng lấn cho PR-AUC 0,8988; chỉ dùng 10 đặc trưng observation 1–2 tuần cho 0,8070. Tín hiệu giảm khi bỏ baseline, nhưng ít hơn kết quả 4+2+2 trước đó; không được ghép hai scenario thành một kết luận.
11. **Demo:** Overview → Customers → một timeline theo T → Statistics → Forecast → Predict → Model Metrics. Chọn một hàng Ghost thật trong danh sách và giữ `snapshot_date`. Gửi ID lạ để cho thấy 404; ngày không hợp lệ cho thấy 422. Cả 7 API đã qua smoke với artifact thật và `ENABLE_DEMO_FIXTURES` tắt.
12. **Kết luận và giới hạn:** Nhóm có một nghiên cứu tái tạo được và demo chạy xuyên suốt. Phát hiện chính là baseline rất quan trọng cho nhãn tương đối. Chỉ nên dùng điểm số như tín hiệu nghiên cứu trên cohort này; chưa đủ bằng chứng cho hệ thống tự động tác động khách hàng. D-01–D-05 và SEM D-07 cần xác nhận trước khi gọi kết quả là cuối cùng.

### Ba câu hỏi dễ gặp

**Tại sao tỷ lệ Ghost ở dashboard khác 46,36% trong bảng model?** Dashboard dùng 5.810 Ghost trên 97.489 history-eligible snapshots, gồm trạng thái khác và nhiều hàng lặp. AI đánh giá Ghost so với Active trên test visitor-disjoint một tuần: 153/330 = 46,36%. Hai mẫu số và hai quần thể khác nhau.

**PR-AUC 0,9097 có nghĩa model biết ai sẽ bỏ đi không?** Không. Nó đo khả năng xếp hạng nhãn Ghost do nhóm định nghĩa trên 330 hàng test. Khi chỉ dùng đặc trưng observation, PR-AUC là 0,8070. Không có nhãn churn thật hoặc thử nghiệm can thiệp.

**Tại sao không có SEM hoặc ARIMA?** Event log không có mô hình đo lường latent đã được định nghĩa, nên nhóm cần hỏi giảng viên hướng xử lý SEM. Với 10 tuần nhãn chín và hai mốc backtest, ARIMA chưa có đủ chuỗi để chọn và kiểm định; nhóm báo cáo baseline và sai số trên mẫu nhỏ.

### Việc cần chuẩn bị trước lúc vào phòng

- Trên máy trình bày, chạy `python -m scripts.verify_real_demo` và `npm run build`. Model binary và dữ liệu đã xử lý không nằm trong Git; xem `docs/runbook.md` nếu phải dựng lại.
- Mở trước dashboard và `/docs`, kiểm tra mạng nội bộ localhost, font và kích thước chữ. Chụp/ghi video một lượt để có phương án dự phòng.
- Kiểm tra mọi con số trong báo cáo/slide theo `docs/evidence_register.md`. Ghi rõ đây là bản AI hỗ trợ soạn thảo trong audit theo yêu cầu môn học.
- Xin giảng viên quyết định D-07 về SEM; lấy ảnh Turnitin và kiểm tra AI; đặt tên repo theo mã lớp/nhóm; nộp các file qua hệ thống môn học. Không đánh dấu các mục đó đã xong trước khi có bằng chứng.

### Nguồn chính

- Retailrocket dataset: <https://www.kaggle.com/datasets/retailrocket/ecommerce-dataset>
- Neslin và cộng sự (2006): <https://doi.org/10.1509/jmkr.43.2.204>
- Burez và Van den Poel (2009): <https://doi.org/10.1016/j.eswa.2008.05.027>
- Saito và Rehmsmeier (2015): <https://doi.org/10.1371/journal.pone.0118432>
- Guo và cộng sự (2017): <https://proceedings.mlr.press/v70/guo17a.html>
- Lundberg và Lee (2017): <https://proceedings.neurips.cc/paper_files/paper/2017/hash/8a20a8621978632d76c43dfd28b67767-Abstract.html>
