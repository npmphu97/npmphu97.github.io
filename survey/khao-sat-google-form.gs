/**
 * TẠO GOOGLE FORM KHẢO SÁT NHU CẦU (tự sinh từ khao-sat-nhu-cau.html, đừng sửa tay phần DATA/ANALYZE).
 * Sửa giá hoặc câu hỏi trong khao-sat-nhu-cau.html rồi chạy lại: node tools/build-google-form.js
 *
 * CÁCH DÙNG (khoảng 5 phút):
 * 1. Vào script.google.com > Dự án mới, dán toàn bộ file này vào, lưu.
 * 2. Chọn hàm taoGoogleForm > Chạy. Cấp quyền khi Google hỏi (Forms, Sheets, Drive, Gmail, trigger).
 * 3. Xem Nhật ký thực thi: có link gửi cho khách (published URL), link chỉnh sửa và link Google Sheet phản hồi.
 * 4. Từ lúc đó, mỗi khi khách gửi form: script tự tính gói và giá, gửi mail tóm tắt cho NOTIFY_EMAIL,
 *    và thêm một dòng phân tích vào sheet "PhanTich" trong Google Sheet phản hồi.
 *
 * Chỉ chạy taoGoogleForm MỘT lần (chạy lại sẽ tạo thêm một form mới). Muốn thử phần tính giá mà
 * không cần điền form: chạy kiemTraPhanTich và xem Nhật ký.
 */
var NOTIFY_EMAIL = 'npmphu97@gmail.com';
var FORM_TITLE = 'Khảo sát nhu cầu website / app / hệ thống';
var ZALO_TEXT = '0379 774 886';

var ans = {}; // dùng bởi res() trong khối DATA

var PRICE = {
  web:[ // 4 cấp website: giá, số tuần (sheet Gói cấp độ)
    {key:'re',     name:'Website gói Rẻ (Landing page)', price:5000000,  weeks:1, inc:['Landing page 1 trang, hiển thị tốt trên điện thoại','Form liên hệ gửi về email','Tối ưu tốc độ, SEO cơ bản','Tên miền riêng, HTTPS']},
    {key:'coban',  name:'Website gói Cơ bản',           price:12000000, weeks:2, inc:['Website giới thiệu khoảng 5 trang','Giới thiệu sản phẩm/dịch vụ theo chuyên mục','Form liên hệ, Google Analytics/Pixel','Tối ưu tốc độ và SEO kỹ thuật']},
    {key:'nangcao',name:'Website gói Nâng cao (có CMS)',price:28000000, weeks:2, inc:['Thiết kế riêng theo thương hiệu','Tự đăng bài, sửa trang, quản lý banner/menu (CMS)','Thư viện ảnh/video, SEO từng trang','Trang quản trị, phân quyền; giám sát và sao lưu tự động']},
    {key:'caocap', name:'Website gói Cao cấp',          price:45000000, weeks:3, inc:['UI/UX riêng, tốc độ cao','Đa ngôn ngữ Việt/Anh','Thanh toán trực tuyến (VNPay, MoMo, QR), email tự động','Đăng nhập Google/Microsoft, chức năng theo yêu cầu riêng']}
  ],
  mini:{
    basic:{name:'Zalo Mini App cơ bản', price:30000000, weeks:4, inc:['Giới thiệu, đặt lịch hoặc điểm danh','Lưu dữ liệu, đồng bộ Excel/OneDrive','Chạy ngay trong Zalo, không cần cài app']},
    adv:  {name:'Zalo Mini App nâng cao',price:70000000, weeks:8, inc:['Bán hàng, giỏ hàng, thanh toán','Tích điểm, thẻ thành viên','Gửi thông báo ZNS, trang quản trị']}
  },
  crm:{name:'CRM tùy chỉnh gọn', price:85000000, weeks:8, inc:['Quản lý khách hàng, pipeline kanban','Nhắc việc, báo giá/hợp đồng xuất PDF','Dashboard doanh số, nhập/xuất Excel']},
  ql: {name:'Hệ thống quản lý vận hành', price:160000000, weeks:12, inc:['Các nghiệp vụ nội bộ theo yêu cầu (nhân sự, lịch, học viên, thu chi...)','Phân quyền theo vai trò, dashboard báo cáo','Nhập/xuất Excel, email thông báo tự động']},
  addon:{ // sheet Bảng giá đề xuất, mục C (một số mục đánh dấu ước tính)
    popup:{name:'Popup thông báo',price:500000},
    ggdich:{name:'Google Dịch (đa ngôn ngữ nhanh)',price:500000},
    dangonngu:{name:'Đa ngôn ngữ Việt/Anh đầy đủ',price:4000000},
    tintuc:{name:'Đẩy tin tức mới',price:1500000},
    leadform:{name:'Popup form thu thông tin khách',price:1500000},
    chat:{name:'Chat Zalo OA / live chat',price:3000000},
    tichhopcrm:{name:'Đẩy khách hàng tiềm năng vào CRM đang dùng',price:6000000},
    thanhtoan:{name:'Cổng thanh toán (VNPay, MoMo, QR)',price:8000000},
    giohang:{name:'Giỏ hàng và bán hàng cơ bản',price:15000000},
    excel:{name:'Nhập, xuất Excel',price:3000000},
    crmmodule:{name:'Module CRM gộp vào hệ thống quản lý',price:25000000,est:true},
    ketoan:{name:'Tích hợp phần mềm kế toán',price:10000000,est:true},
    hoadon:{name:'Tích hợp hóa đơn điện tử',price:8000000,est:true},
    nganhang:{name:'Đối soát ngân hàng / VietQR',price:10000000,est:true},
    zns:{name:'Gửi tin Zalo ZNS',price:6000000,est:true}
  },
  ops:{ // sheet Vận hành
    coban:{name:'Vận hành Cơ bản',fee:538333,sla:'Phản hồi trong 2 ngày làm việc'},
    tieuchuan:{name:'Vận hành Tiêu chuẩn',fee:2653333,sla:'Phản hồi trong 1 ngày làm việc'},
    nangcao:{name:'Vận hành Nâng cao',fee:5563333,sla:'Phản hồi trong 4 giờ làm việc, trực ngoài giờ'}
  },
  vat:0.1
};

/* ============================================================
   BỘ CÂU HỎI
   type: text | email | tel | textarea | radio | check
   show(a): điều kiện hiển thị theo câu trả lời trước
   ============================================================ */
function has(a,k,v){return Array.isArray(a[k])&&a[k].indexOf(v)>=0}
function wantsWeb(a){return ['landing','web','cms','shop'].some(function(v){return has(a,'muc_tieu',v)})}
function wantsSys(a){return has(a,'muc_tieu','crm')||has(a,'muc_tieu','ql')}
function wantsMini(a){return has(a,'muc_tieu','mini')}

/* ============================================================
   TÙY CHỈNH THEO LĨNH VỰC KINH DOANH
   - goals: nhãn của 8 mục tiêu (null = ẩn). Mã mục tiêu giữ nguyên để logic giá không đổi.
   - nv: danh sách nghiệp vụ [mã, nhãn]. Mã không thuộc CRM (khach_hang, pipeline,
     bao_gia, nhac_viec, bao_cao) sẽ được tính là hệ thống quản lý vận hành.
   - pop: các mục thường gặp ở lĩnh vực này (hiện nhãn "Thường gặp").
   ============================================================ */
function ext(a,b){var o={},k;for(k in a)o[k]=a[k];for(k in b)o[k]=b[k];return o}
var GOAL_ORDER=['landing','web','cms','shop','mini','crm','ql','unknown'];
var SEC_DEFAULT={
  name:'chung',
  goals:{
    landing:'Một trang giới thiệu để chạy quảng cáo, thu số điện thoại khách',
    web:'Website giới thiệu công ty, sản phẩm, dịch vụ chuyên nghiệp',
    cms:'Website tự đăng tin tức, bài viết, làm SEO lên Google lâu dài',
    shop:'Bán hàng online: khách đặt hàng, thanh toán trên web',
    mini:'Ứng dụng trên Zalo (Mini App): đặt lịch, tích điểm, mua hàng',
    crm:'Quản lý khách hàng, theo dõi cơ hội bán hàng, báo giá',
    ql:'Quản lý vận hành nội bộ: nhân sự, lịch, kho, thu chi...',
    unknown:'Chưa rõ, cần được tư vấn'},
  pop:[],
  vd:'Ví dụ: “Khách hỏi qua Zalo nhiều quá, muốn có chỗ để khách tự đặt lịch” hoặc “Đang quản lý bằng Excel, hay sai sót”.',
  nvEx:'Ví dụ: quản lý hợp đồng, bảo hành, công văn...',
  nv:[['khach_hang','Khách hàng, lịch sử liên hệ'],['pipeline','Cơ hội bán hàng theo giai đoạn'],['bao_gia','Báo giá, hợp đồng'],['nhac_viec','Nhắc việc, chăm sóc khách'],
      ['nhan_su','Nhân sự, hồ sơ nhân viên'],['lich','Lịch làm việc, ca, phân công'],['diem_danh','Chấm công / điểm danh'],['thu_chi','Thu chi, công nợ'],
      ['kho','Kho, sản phẩm'],['don_hang','Đơn hàng'],['bao_cao','Báo cáo, dashboard']]
};
var SECTORS={
 giao_duc:{name:'giáo dục',
  goals:{landing:'Trang đăng ký học thử / tuyển sinh để chạy quảng cáo, thu số điện thoại phụ huynh',
    web:'Website giới thiệu trung tâm: khóa học, giáo viên, học phí, cơ sở',
    cms:'Website đăng tin tuyển sinh, lịch khai giảng, thành tích học viên, lên Google',
    shop:'Bán khóa học online: đăng ký và đóng học phí ngay trên web',
    mini:'Mini App trên Zalo cho phụ huynh/học viên: đăng ký học thử, xem lịch, điểm danh',
    crm:'Quản lý học viên tiềm năng, theo dõi tư vấn tuyển sinh, báo giá học phí',
    ql:'Quản lý lớp học, học viên, giáo viên, điểm danh, học phí'},
  pop:['web','mini','ql'],
  vd:'Ví dụ: “Đang quản lý học viên bằng Excel, hay sai sót học phí” hoặc “Muốn phụ huynh tự đăng ký học thử qua Zalo”.',
  nvEx:'Ví dụ: thi xếp lớp, cấp chứng chỉ, học bù, xe đưa đón...',
  nv:[['khach_hang','Học viên tiềm năng, lịch sử tư vấn'],['pipeline','Tiến trình tuyển sinh: tư vấn, học thử, đăng ký'],['bao_gia','Báo giá học phí, hợp đồng đăng ký'],['nhac_viec','Nhắc lịch gọi tư vấn, nhắc đóng học phí'],
      ['hoc_vien','Hồ sơ học viên, lớp học'],['lich','Thời khóa biểu, phòng học, lịch dạy'],['diem_danh','Điểm danh học viên và giáo viên'],['diem_so','Điểm, nhận xét, thông báo kết quả cho phụ huynh'],
      ['nhan_su','Giáo viên, nhân viên, lương theo giờ dạy'],['thu_chi','Học phí, công nợ, thu chi'],['kho','Giáo trình, tài liệu, thiết bị'],['bao_cao','Báo cáo doanh thu, sĩ số, tỷ lệ chuyển đổi']]},
 ban_le:{name:'bán lẻ, thương mại',
  goals:{landing:'Trang giới thiệu sản phẩm/khuyến mãi để chạy quảng cáo, thu số điện thoại khách',
    web:'Website giới thiệu cửa hàng, danh mục sản phẩm, địa chỉ chi nhánh',
    cms:'Website đăng tin khuyến mãi, bài viết, làm SEO để khách tìm thấy trên Google',
    shop:'Bán hàng online: giỏ hàng, đặt hàng, thanh toán',
    mini:'Mini App trên Zalo: đặt hàng, tích điểm, thẻ thành viên, voucher',
    crm:'Quản lý khách hàng, lịch sử mua, chăm sóc khách quen',
    ql:'Quản lý kho, đơn hàng, nhập xuất, công nợ, nhân viên'},
  pop:['shop','mini','ql'],
  vd:'Ví dụ: “Hàng tồn kho hay lệch sổ sách” hoặc “Muốn khách tích điểm và đặt hàng ngay trên Zalo”.',
  nvEx:'Ví dụ: trả hàng, bảo hành, quản lý nhiều cửa hàng...',
  nv:[['khach_hang','Khách hàng, lịch sử mua hàng'],['bao_gia','Báo giá khách sỉ, hợp đồng'],['nhac_viec','Nhắc chăm sóc khách, nhắc nợ'],
      ['don_hang','Đơn hàng online và tại quầy'],['kho','Kho, tồn kho, nhập xuất'],['ncc','Nhà cung cấp, đơn nhập hàng'],['khuyen_mai','Khuyến mãi, voucher, tích điểm'],
      ['thu_chi','Thu chi, công nợ'],['nhan_su','Nhân viên, ca làm'],['diem_danh','Chấm công'],['bao_cao','Báo cáo doanh thu, hàng bán chạy']]},
 dich_vu:{name:'dịch vụ (spa, phòng khám, nhà hàng, salon)',
  goals:{landing:'Trang giới thiệu dịch vụ/ưu đãi để chạy quảng cáo, thu số điện thoại, nhận đặt lịch',
    web:'Website giới thiệu dịch vụ, bảng giá, hình ảnh cơ sở, địa chỉ',
    cms:'Website đăng bài chăm sóc, tin ưu đãi, làm SEO lên Google',
    shop:'Bán sản phẩm, gói dịch vụ, thẻ trả trước online',
    mini:'Mini App trên Zalo: đặt lịch hẹn, thẻ thành viên, tích điểm, nhắc lịch',
    crm:'Quản lý khách hàng, lịch sử sử dụng dịch vụ, chăm sóc sau dịch vụ',
    ql:'Quản lý lịch hẹn, nhân viên, liệu trình, thu chi'},
  pop:['landing','mini','ql'],
  vd:'Ví dụ: “Khách đặt lịch qua Zalo và Facebook lẫn lộn, hay bị trùng giờ” hoặc “Muốn quản lý thẻ liệu trình của khách”.',
  nvEx:'Ví dụ: hồ sơ bệnh án, đơn thuốc, tính hoa hồng tour, đặt bàn...',
  nv:[['khach_hang','Hồ sơ khách, lịch sử sử dụng dịch vụ'],['lich','Lịch hẹn, phân ca nhân viên, phòng/giường'],['lieu_trinh','Liệu trình, thẻ trả trước, số buổi còn lại'],['nhac_viec','Nhắc lịch hẹn, chăm sóc sau dịch vụ'],
      ['khuyen_mai','Khuyến mãi, voucher, tích điểm'],['nhan_su','Nhân viên, hoa hồng'],['diem_danh','Chấm công'],['thu_chi','Thu chi, thanh toán, công nợ'],['kho','Kho vật tư, sản phẩm'],['bao_cao','Báo cáo doanh thu, khách quay lại']]},
 tu_van:{name:'luật, kế toán, tư vấn',
  goals:{landing:'Trang giới thiệu dịch vụ để chạy quảng cáo, thu thông tin khách cần tư vấn',
    web:'Website giới thiệu công ty, lĩnh vực hành nghề, đội ngũ chuyên gia, uy tín',
    cms:'Website đăng bài chuyên môn, tin pháp lý/thuế, làm SEO tạo uy tín',
    shop:'Bán gói tư vấn, tài liệu, khóa học online',
    mini:'Mini App trên Zalo: đặt lịch hẹn tư vấn, tra cứu tiến độ hồ sơ',
    crm:'Quản lý khách hàng, theo dõi cơ hội, báo giá phí dịch vụ',
    ql:'Quản lý vụ việc/hồ sơ, tiến độ, deadline, tính giờ làm, thu phí'},
  pop:['cms','crm','ql'],
  vd:'Ví dụ: “Hồ sơ vụ việc nằm rải rác, hay quên hạn nộp” hoặc “Muốn website để khách tìm thấy và tin tưởng hơn”.',
  nvEx:'Ví dụ: ủy quyền, lưu hồ sơ theo thời hạn, tính phí theo giờ...',
  nv:[['khach_hang','Khách hàng, hồ sơ liên hệ'],['pipeline','Cơ hội tư vấn đang theo dõi'],['bao_gia','Báo giá phí, hợp đồng dịch vụ xuất PDF'],['nhac_viec','Nhắc hạn nộp, deadline, lịch hẹn'],
      ['vu_viec','Hồ sơ/vụ việc và tiến độ xử lý'],['tai_lieu','Lưu trữ tài liệu, phân quyền xem'],['gio_cong','Chấm giờ làm việc theo vụ việc'],['thu_chi','Phí dịch vụ, tạm ứng, công nợ'],
      ['nhan_su','Nhân sự, phân công'],['lich','Lịch hẹn, lịch họp'],['bao_cao','Báo cáo doanh thu, khối lượng việc']]},
 san_xuat:{name:'sản xuất, phân phối',
  goals:{landing:'Trang giới thiệu sản phẩm/năng lực để chạy quảng cáo, nhận yêu cầu báo giá',
    web:'Website giới thiệu nhà máy, sản phẩm, năng lực sản xuất, chứng nhận',
    cms:'Website đăng tin, catalogue, làm SEO để đối tác tìm thấy trên Google',
    shop:'Cổng đặt hàng online cho đại lý, khách sỉ',
    mini:'Mini App trên Zalo cho đại lý: tra cứu sản phẩm, đặt hàng nhanh',
    crm:'Quản lý khách hàng, đại lý, báo giá, theo dõi đơn lớn',
    ql:'Quản lý đơn hàng, kho, sản xuất, giao hàng, công nợ đại lý'},
  pop:['web','crm','ql'],
  vd:'Ví dụ: “Đơn hàng đại lý ghi sổ tay, hay nhầm tồn kho” hoặc “Muốn có catalogue online cho đối tác nước ngoài”.',
  nvEx:'Ví dụ: truy xuất lô hàng, bảo trì máy, kiểm tra chất lượng...',
  nv:[['khach_hang','Khách hàng, đại lý'],['pipeline','Cơ hội đơn hàng lớn'],['bao_gia','Báo giá, hợp đồng'],['nhac_viec','Nhắc chăm sóc đại lý, nhắc nợ'],
      ['don_hang','Đơn hàng, giao hàng'],['kho','Kho nguyên vật liệu, thành phẩm'],['san_xuat','Lệnh sản xuất, tiến độ'],['ncc','Nhà cung cấp, đơn nhập'],
      ['thu_chi','Công nợ đại lý, thu chi'],['nhan_su','Nhân sự, ca làm'],['diem_danh','Chấm công'],['bao_cao','Báo cáo sản lượng, doanh thu']]},
 bds:{name:'bất động sản, xây dựng',
  goals:{landing:'Trang giới thiệu dự án để chạy quảng cáo, thu thông tin khách quan tâm',
    web:'Website giới thiệu công ty, dự án, công trình đã thực hiện',
    cms:'Website đăng tin dự án, bài viết thị trường, làm SEO',
    shop:null,
    mini:'Mini App trên Zalo: xem dự án, đặt lịch xem nhà, nhận tư vấn',
    crm:'Quản lý khách mua, nhu cầu, lịch xem nhà, theo dõi cơ hội',
    ql:'Quản lý giỏ hàng dự án, hợp đồng, tiến độ công trình, thu chi'},
  pop:['landing','crm','ql'],
  vd:'Ví dụ: “Môi giới ghi khách ra Excel riêng, mất khách khi nhân viên nghỉ” hoặc “Cần trang giới thiệu dự án để chạy quảng cáo”.',
  nvEx:'Ví dụ: pháp lý dự án, nghiệm thu, bảo hành công trình...',
  nv:[['khach_hang','Khách hàng, nhu cầu, lịch sử liên hệ'],['pipeline','Tiến trình khách: quan tâm, xem nhà, đặt cọc, ký'],['bao_gia','Báo giá, hợp đồng'],['nhac_viec','Nhắc lịch xem nhà, nhắc thanh toán theo đợt'],
      ['san_pham','Giỏ hàng: căn/lô/sản phẩm và trạng thái'],['du_an','Tiến độ công trình, hạng mục'],['thu_chi','Thu theo đợt, công nợ, chi phí công trình'],['kho','Vật tư, thiết bị'],
      ['nhan_su','Nhân viên, môi giới, hoa hồng'],['lich','Lịch làm việc, lịch xem nhà'],['bao_cao','Báo cáo bán hàng, tiến độ']]}
};
function sec(a){var k=SECTORS[a.linh_vuc];return k?ext(SEC_DEFAULT,k):SEC_DEFAULT}
function goalOpts(a){var S=sec(a),g=ext(SEC_DEFAULT.goals,S.goals);
  return GOAL_ORDER.filter(function(k){return g[k]!==null}).map(function(k){return S.pop.indexOf(k)>=0?[k,g[k],'Thường gặp ở lĩnh vực này']:[k,g[k]]})}
function nvOpts(a){return sec(a).nv}
function res(x){return typeof x==='function'?x(ans):x}
function getOpts(q,a){return typeof q.opts==='function'?q.opts(a||ans):q.opts}
function secNote(a){return a.linh_vuc&&SECTORS[a.linh_vuc]?' Các lựa chọn đã được điều chỉnh theo lĩnh vực '+SECTORS[a.linh_vuc].name+'.':''}

var STEPS = [
 {id:'s1',title:'Thông tin',desc:'Để mình biết liên hệ với ai và hiểu bối cảnh doanh nghiệp.',qs:[
  {id:'ho_ten',type:'text',label:'Họ và tên',req:true},
  {id:'cong_ty',type:'text',label:'Tên doanh nghiệp / thương hiệu',req:true},
  {id:'sdt',type:'tel',label:'Số điện thoại / Zalo',req:true},
  {id:'email',type:'email',label:'Email'},
  {id:'vai_tro',type:'radio',label:'Vai trò của bạn trong dự án',req:true,opts:[
    ['chu','Chủ doanh nghiệp / người quyết định'],['quanly','Quản lý được giao phụ trách'],['tim_hieu','Nhân viên, đang tìm hiểu giúp']]},
  {id:'linh_vuc',type:'radio',label:'Lĩnh vực kinh doanh',req:true,opts:[
    ['giao_duc','Giáo dục, trung tâm đào tạo'],['ban_le','Bán lẻ, thương mại, cửa hàng'],['dich_vu','Dịch vụ: spa, phòng khám, nhà hàng, salon'],
    ['tu_van','Luật, kế toán, tư vấn'],['san_xuat','Sản xuất, phân phối'],['bds','Bất động sản, xây dựng'],['khac','Khác']]},
  {id:'quy_mo',type:'radio',label:'Quy mô nhân sự',opts:[['1-5','1 đến 5 người'],['6-20','6 đến 20 người'],['21-50','21 đến 50 người'],['50+','Trên 50 người']]}
 ]},
 {id:'s2',title:'Mục tiêu',desc:'Phần quan trọng nhất: bạn muốn giải quyết việc gì.',qs:[
  {id:'muc_tieu',type:'check',label:'Bạn cần làm gì? (chọn tất cả việc phù hợp)',req:true,opts:goalOpts,h:function(a){return 'Chọn tất cả việc phù hợp.'+secNote(a)}},
  {id:'van_de',type:'textarea',label:'Mô tả ngắn vấn đề bạn đang gặp hoặc kết quả bạn mong muốn',h:function(a){return sec(a).vd}},
  {id:'hien_co',type:'check',label:'Hiện tại bạn đã có những gì?',opts:[
    ['chua_co','Chưa có gì'],['web_cu','Website cũ (muốn làm lại)'],['ten_mien','Tên miền'],['fanpage','Fanpage Facebook / TikTok'],
    ['zalo_oa','Zalo OA (trang Zalo doanh nghiệp)'],['excel','Đang quản lý bằng Excel / Google Sheet'],['phan_mem','Đang dùng một phần mềm khác']]},
  {id:'phan_mem_ten',type:'text',label:'Phần mềm đang dùng là gì? Điều gì chưa hài lòng?',show:function(a){return has(a,'hien_co','phan_mem')||has(a,'hien_co','web_cu')}},
  {id:'nguoi_dung',type:'radio',label:'Ai là người dùng chính?',req:true,opts:[
    ['khach','Khách hàng bên ngoài'],['noi_bo','Nhân viên nội bộ'],['ca_hai','Cả hai']]},
  {id:'kenh',type:'check',label:'Khách hàng thường tìm đến bạn qua đâu?',opts:[
    ['google','Tìm trên Google'],['ads','Quảng cáo Facebook / TikTok'],['zalo','Zalo'],['gioi_thieu','Người quen giới thiệu'],['truc_tiep','Đến trực tiếp cửa hàng']]}
 ]},
 {id:'s3',title:'Website',desc:'Giúp xác định quy mô và cấp độ website.',show:wantsWeb,qs:[
  {id:'so_trang',type:'radio',label:'Website cần khoảng bao nhiêu trang?',req:true,h:'Mỗi trang là một mục trên menu, ví dụ: Trang chủ, Giới thiệu, Dịch vụ, Tin tức, Liên hệ.',opts:[
    ['1','1 trang duy nhất (landing page)'],['2-5','2 đến 5 trang'],['6-15','6 đến 15 trang'],['15+','Trên 15 trang'],['chua_ro','Chưa rõ']]},
  {id:'cap_nhat',type:'radio',label:'Bạn sẽ thay đổi nội dung website thường xuyên cỡ nào?',req:true,opts:[
    ['hiem','Hầu như không, làm xong để đó'],['nam','Vài lần một năm'],['thang','Hằng tháng (đăng tin, khuyến mãi)'],['tuan','Hằng tuần trở lên']]},
  {id:'ai_cap_nhat',type:'radio',label:'Ai sẽ cập nhật nội dung?',opts:[
    ['tu_lam','Tôi / nhân viên tự làm'],['nho','Nhờ bên làm web cập nhật giúp']]},
  {id:'giao_dien',type:'radio',label:'Bạn muốn giao diện như thế nào?',req:true,opts:[
    ['mau','Dùng mẫu đẹp có sẵn, chỉnh theo màu và logo'],['rieng','Thiết kế riêng hoàn toàn, khác biệt'],['chua_ro','Chưa rõ']]},
  {id:'nhan_dien',type:'radio',label:'Bạn đã có logo, màu sắc thương hiệu chưa?',opts:[
    ['co','Đã có đầy đủ'],['logo','Có logo, chưa có bộ nhận diện'],['chua','Chưa có, cần thiết kế']]},
  {id:'noi_dung',type:'radio',label:'Nội dung (chữ, hình ảnh) đã sẵn sàng chưa?',opts:[
    ['du','Có đủ'],['mot_phan','Có một phần'],['chua','Chưa có, cần hỗ trợ viết nội dung']]},
  {id:'ngon_ngu',type:'radio',label:'Website cần những ngôn ngữ nào?',opts:[
    ['vi','Chỉ tiếng Việt'],['gg','Có nút dịch tự động (Google Dịch) là đủ'],['vi_en','Việt và Anh, nội dung viết riêng từng ngôn ngữ']]},
  {id:'chuc_nang',type:'check',label:'Website cần thêm chức năng nào?',h:'Chọn những gì bạn thật sự cần ngay. Có thể bổ sung sau.',opts:[
    ['form','Form liên hệ gửi về email'],['leadform','Popup thu thông tin khách hàng'],['popup','Popup thông báo, khuyến mãi'],
    ['chat','Nút chat Zalo / Messenger'],['tintuc','Tin tức, bài viết'],['thu_vien','Thư viện ảnh, video'],
    ['gio_hang','Giỏ hàng, đặt hàng'],['thanh_toan','Thanh toán online (VNPay, MoMo, QR)'],['dat_lich','Khách đặt lịch hẹn'],
    ['dang_nhap','Khách đăng nhập tài khoản thành viên'],['email_tu_dong','Email tự động (xác nhận đơn, lịch hẹn)'],
    ['day_crm','Đẩy khách hàng vào phần mềm CRM đang dùng'],['analytics','Đo lượt truy cập (Google Analytics, Pixel)']]},
  {id:'so_san_pham',type:'radio',label:'Số lượng sản phẩm dự kiến bán online',show:function(a){return has(a,'muc_tieu','shop')||has(a,'chuc_nang','gio_hang')},opts:[
    ['<50','Dưới 50'],['50-500','50 đến 500'],['500+','Trên 500'],['chua_ro','Chưa rõ']]},
  {id:'tham_khao',type:'textarea',label:'Website bạn thích để tham khảo (dán link, ghi điểm bạn thích)'}
 ]},
 {id:'s4',title:'Hệ thống',desc:'Giúp ước lượng quy mô CRM / hệ thống quản lý.',show:wantsSys,qs:[
  {id:'so_user',type:'radio',label:'Bao nhiêu người sẽ dùng hệ thống?',req:true,opts:[
    ['1-5','1 đến 5 người'],['6-20','6 đến 20 người'],['21-50','21 đến 50 người'],['50+','Trên 50 người']]},
  {id:'nghiep_vu',type:'check',label:'Cần quản lý những việc gì?',req:true,opts:nvOpts,h:function(a){return 'Chọn tất cả nghiệp vụ cần đưa vào hệ thống.'+secNote(a)}},
  {id:'nghiep_vu_khac',type:'text',label:'Nghiệp vụ khác (nếu có)',h:function(a){return sec(a).nvEx}},
  {id:'chi_nhanh',type:'radio',label:'Doanh nghiệp có mấy chi nhánh / cơ sở?',opts:[['1','1 cơ sở'],['2-3','2 đến 3'],['4+','4 trở lên']]},
  {id:'phan_quyen',type:'radio',label:'Phân quyền người dùng',opts:[
    ['don_gian','Đơn giản: quản trị và nhân viên'],['vai_tro','Vài vai trò khác nhau (sale, kế toán, quản lý...)'],['phuc_tap','Phức tạp: theo chi nhánh, phòng ban, duyệt nhiều cấp']]},
  {id:'du_lieu',type:'radio',label:'Có dữ liệu cũ cần chuyển vào hệ thống không?',opts:[
    ['khong','Không, làm mới từ đầu'],['it','Có, vài file Excel'],['nhieu','Nhiều dữ liệu, từ nhiều nguồn']]},
  {id:'tich_hop',type:'check',label:'Cần kết nối với hệ thống nào?',opts:[
    ['ketoan','Phần mềm kế toán (MISA, Fast...)'],['hoadon','Hóa đơn điện tử'],['nganhang','Ngân hàng / VietQR để đối soát'],['zns','Gửi tin Zalo ZNS cho khách'],['khong','Không cần'],['chua_ro','Chưa rõ']]},
  {id:'nen_tang',type:'radio',label:'Nhân viên dùng trên thiết bị nào?',opts:[
    ['may_tinh','Chủ yếu máy tính'],['ca_hai','Cả máy tính và điện thoại (qua trình duyệt)'],['app','Cần app riêng cài trên điện thoại']]}
 ]},
 {id:'s5',title:'Zalo Mini App',desc:'Giúp chọn gói Mini App phù hợp.',show:wantsMini,qs:[
  {id:'mini_cn',type:'check',label:'Mini App cần làm được gì?',req:true,opts:[
    ['gioi_thieu','Giới thiệu doanh nghiệp, dịch vụ'],['dat_lich','Khách đặt lịch'],['diem_danh','Điểm danh, check-in'],['ban_hang','Bán hàng, giỏ hàng'],
    ['tich_diem','Tích điểm, thẻ thành viên'],['thanh_toan','Thanh toán trong app'],['zns','Gửi thông báo ZNS'],['dong_bo','Đồng bộ dữ liệu ra Excel']]},
  {id:'zalo_oa',type:'radio',label:'Doanh nghiệp đã có Zalo OA đã xác thực chưa?',opts:[['co','Đã có, đã xác thực'],['chua_xt','Có nhưng chưa xác thực'],['chua','Chưa có']]},
  {id:'mini_kh',type:'radio',label:'Số khách dự kiến dùng mỗi tháng',opts:[['<500','Dưới 500'],['500-5000','500 đến 5.000'],['5000+','Trên 5.000']]}
 ]},
 {id:'s6',title:'Ngân sách',desc:'Không bắt buộc chính xác, giúp mình đề xuất phương án vừa túi tiền.',qs:[
  {id:'ngan_sach',type:'radio',label:'Ngân sách dự kiến cho phần làm mới (chưa gồm phí duy trì)',req:true,opts:[
    ['<5','Dưới 5 triệu'],['5-15','5 đến 15 triệu'],['15-30','15 đến 30 triệu'],['30-50','30 đến 50 triệu'],
    ['50-100','50 đến 100 triệu'],['100-200','100 đến 200 triệu'],['200+','Trên 200 triệu'],['chua_ro','Chưa xác định, cần tư vấn']]},
  {id:'thoi_gian',type:'radio',label:'Khi nào bạn cần đưa vào sử dụng?',req:true,opts:[
    ['gap','Rất gấp, trong 2 tuần'],['1thang','Trong khoảng 1 tháng'],['2-3thang','Trong 2 đến 3 tháng'],['4-6thang','Trong 4 đến 6 tháng'],['linh_hoat','Linh hoạt, làm kỹ là được']]},
  {id:'bat_dau',type:'radio',label:'Bạn dự định bắt đầu khi nào?',opts:[
    ['ngay','Ngay khi chốt phương án'],['thang_nay','Trong tháng này'],['quy','Trong quý này'],['tham_khao','Đang tham khảo giá']]},
  {id:'van_hanh',type:'radio',label:'Sau khi bàn giao, bạn muốn vận hành thế nào?',req:true,opts:[
    ['tu_quan','Tự quản lý, chỉ cần duy trì tên miền, hosting'],['co_ban','Cần hỗ trợ khi có lỗi, sao lưu định kỳ'],['tron_goi','Giao trọn gói: giám sát, cập nhật bảo mật, chỉnh sửa nhỏ hằng tháng']]},
  {id:'su_co',type:'radio',label:'Nếu hệ thống ngừng hoạt động, mức ảnh hưởng thế nào?',opts:[
    ['it','Không sao, chờ vài ngày được'],['trong_ngay','Cần khắc phục trong ngày'],['gio','Nghiêm trọng, cần xử lý trong vài giờ kể cả ngoài giờ']]},
  {id:'vat',type:'radio',label:'Bạn có cần xuất hóa đơn VAT không?',opts:[['co','Có'],['khong','Không']]},
  {id:'lien_he_qua',type:'check',label:'Bạn muốn trao đổi tiếp qua kênh nào?',opts:[['zalo','Zalo'],['goi','Gọi điện'],['email','Email'],['hop','Họp online (Google Meet / Zoom)']]},
  {id:'ghi_chu',type:'textarea',label:'Điều gì khác bạn muốn mình biết?'}
 ]}
];



var BUDGET={'<5':[0,5e6],'5-15':[5e6,15e6],'15-30':[15e6,30e6],'30-50':[30e6,50e6],'50-100':[50e6,100e6],'100-200':[100e6,200e6],'200+':[200e6,Infinity]};
var DEADLINE_WEEKS={gap:2,'1thang':4,'2-3thang':12,'4-6thang':26,linh_hoat:99};
function r5(n){return Math.round(n/5e5)*5e5}
function money(n){return n.toLocaleString('vi-VN')+' đ'}
function trieu(n){var t=n/1e6;return (Math.round(t*10)/10).toLocaleString('vi-VN')+' triệu'}

function analyze(a){
  var items=[], addons=[], notes=[], ask=[], flags=[], backend=false, weeks=[];
  var goals=a.muc_tieu||[], fn=a.chuc_nang||[];
  var unknownOnly=goals.length===1&&goals[0]==='unknown';
  function addon(k,why){var x=PRICE.addon[k];addons.push({name:x.name,price:x.price,est:!!x.est,why:why||''});}

  // --- 1. Website ---
  if(wantsWeb(a)||(unknownOnly&&a.nguoi_dung!=='noi_bo')){
    var lv=(has(a,'muc_tieu','landing')&&goals.filter(function(g){return g!=='unknown'}).length===1&&a.so_trang==='1')?0:1;
    var why=[];
    if(a.so_trang==='15+'){lv=Math.max(lv,2);why.push('trên 15 trang');}
    if(has(a,'muc_tieu','cms')){lv=Math.max(lv,2);why.push('cần tự đăng bài, SEO lâu dài');}
    if(a.cap_nhat==='thang'||a.cap_nhat==='tuan'){lv=Math.max(lv,2);why.push('cập nhật nội dung thường xuyên');}
    if(a.ai_cap_nhat==='tu_lam'&&a.cap_nhat!=='hiem'){lv=Math.max(lv,2);why.push('tự cập nhật nội dung');}
    if(a.giao_dien==='rieng'){lv=Math.max(lv,2);why.push('thiết kế riêng');}
    if(fn.indexOf('thu_vien')>=0){lv=Math.max(lv,2);why.push('thư viện ảnh/video');}
    // các chức năng cần lập trình riêng: từ 2 mục trở lên thì lên Cao cấp
    var hi=['dang_nhap','dat_lich','email_tu_dong'].filter(function(k){return fn.indexOf(k)>=0});
    var premium=hi.length+(a.ngon_ngu==='vi_en'?1:0)+(fn.indexOf('thanh_toan')>=0?1:0);
    if(hi.length||premium>=2){lv=3;why.push('cần chức năng lập trình riêng ('+[a.ngon_ngu==='vi_en'?'đa ngôn ngữ':'',fn.indexOf('thanh_toan')>=0?'thanh toán':''].concat(hi.map(function(k){return{dang_nhap:'đăng nhập',dat_lich:'đặt lịch',email_tu_dong:'email tự động'}[k]})).filter(Boolean).join(', ')+')');}
    if(has(a,'muc_tieu','shop')||fn.indexOf('gio_hang')>=0)lv=Math.max(lv,1);
    var w=PRICE.web[lv];
    items.push({type:'web',name:w.name,price:w.price,inc:w.inc,why:why,weeks:w.weeks});
    weeks.push(w.weeks); if(lv>=2)backend=true;

    if(lv<3&&a.ngon_ngu==='vi_en')addon('dangonngu');
    if(a.ngon_ngu==='gg')addon('ggdich');
    if(lv<3&&fn.indexOf('thanh_toan')>=0)addon('thanhtoan');
    if(has(a,'muc_tieu','shop')||fn.indexOf('gio_hang')>=0){
      addon('giohang');backend=true;weeks[weeks.length-1]+=2;
      if(a.so_san_pham==='500+')notes.push('Trên 500 sản phẩm: cần nhập liệu hàng loạt từ Excel, cân nhắc thêm module Nhập/xuất Excel.');
    }
    if(fn.indexOf('popup')>=0)addon('popup');
    if(fn.indexOf('leadform')>=0)addon('leadform');
    if(fn.indexOf('chat')>=0&&lv<3)addon('chat');
    if(fn.indexOf('tintuc')>=0&&lv<2)addon('tintuc','gói dưới Nâng cao chưa có CMS');
    if(fn.indexOf('day_crm')>=0&&!wantsSys(a))addon('tichhopcrm');
    if(a.nhan_dien==='chua')notes.push('Khách chưa có logo/bộ nhận diện: báo riêng phần thiết kế nhận diện hoặc giới thiệu đối tác.');
    if(a.noi_dung==='chua')notes.push('Khách chưa có nội dung: báo riêng phí biên soạn nội dung, hình ảnh.');
    if(fn.indexOf('thanh_toan')>=0)ask.push('Đã có tài khoản doanh nghiệp VNPay/MoMo chưa? (cần để kích hoạt cổng thanh toán)');
    if(fn.indexOf('dat_lich')>=0)ask.push('Đặt lịch theo nhân viên, theo phòng hay theo khung giờ? Có cần đặt cọc không?');
    if(a.so_trang==='chua_ro')ask.push('Chốt danh sách trang (sitemap) trong buổi trao đổi.');
  }

  // --- 2. CRM / hệ thống quản lý ---
  if(wantsSys(a)||(unknownOnly&&a.nguoi_dung==='noi_bo')){
    var nv=a.nghiep_vu||[], crmSet=['khach_hang','pipeline','bao_gia','nhac_viec','bao_cao'];
    var ops=nv.filter(function(k){return crmSet.indexOf(k)<0});
    var isQL=has(a,'muc_tieu','ql')||ops.length>0;
    var base=isQL?PRICE.ql:PRICE.crm, f=1, fwhy=[];
    if(isQL){
      var n=nv.length;
      if(n&&n<=3){f-=0.2;fwhy.push('ít nghiệp vụ ('+n+')');}
      if(n>7){f+=0.05*(n-7);fwhy.push('nhiều nghiệp vụ ('+n+')');}
      if(has(a,'muc_tieu','crm')&&(nv.indexOf('pipeline')>=0||nv.indexOf('bao_gia')>=0))addon('crmmodule','vừa cần CRM vừa cần quản lý vận hành');
    }
    if(a.so_user==='21-50'){f+=0.1;fwhy.push('21 đến 50 người dùng');}
    if(a.so_user==='50+'){f+=0.25;fwhy.push('trên 50 người dùng');}
    if(a.chi_nhanh==='2-3'){f+=0.1;fwhy.push('2 đến 3 chi nhánh');}
    if(a.chi_nhanh==='4+'){f+=0.2;fwhy.push('từ 4 chi nhánh');}
    if(a.phan_quyen==='phuc_tap'){f+=0.1;fwhy.push('phân quyền nhiều cấp');}
    var p=r5(base.price*f);
    items.push({type:'sys',name:base.name,price:p,inc:base.inc,why:fwhy,range:true,weeks:Math.ceil(base.weeks*Math.max(f,0.8))});
    weeks.push(Math.ceil(base.weeks*Math.max(f,0.8))); backend=true;
    (a.tich_hop||[]).forEach(function(k){if(PRICE.addon[k])addon(k);});
    if(a.du_lieu==='nhieu'){notes.push('Chuyển dữ liệu từ nhiều nguồn: báo riêng sau khi xem dữ liệu mẫu.');ask.push('Xin file dữ liệu mẫu (Excel) để ước lượng công chuyển đổi.');}
    if(a.nen_tang==='app'){flags.push('Khách cần app di động cài riêng: phần app báo riêng (thường cộng thêm 40 đến 60% giá hệ thống). Gợi ý bản web chạy tốt trên điện thoại trước.');}
    if(has(a,'tich_hop','ketoan'))ask.push('Phần mềm kế toán nào, phiên bản nào, có API không?');
    if(nv.length)ask.push('Xin quy trình làm việc hiện tại của từng nghiệp vụ (mẫu biểu, file Excel đang dùng).');
  }

  // --- 3. Zalo Mini App ---
  if(wantsMini(a)){
    var mc=a.mini_cn||[];
    var adv=['ban_hang','tich_diem','thanh_toan','zns'].some(function(k){return mc.indexOf(k)>=0});
    var m=adv?PRICE.mini.adv:PRICE.mini.basic;
    items.push({type:'mini',name:m.name,price:m.price,inc:m.inc,why:adv?['có bán hàng / tích điểm / thanh toán / ZNS']:['giới thiệu, đặt lịch, điểm danh'],weeks:m.weeks});
    weeks.push(m.weeks); if(adv)backend=true;
    if(a.zalo_oa!=='co')ask.push('Zalo OA chưa xác thực: cần xác thực OA trước khi đăng Mini App (khách tự làm, mình hướng dẫn).');
    if(a.mini_kh==='5000+')notes.push('Trên 5.000 khách/tháng: chọn VPS mạnh hơn, xem lại gói vận hành.');
  }

  if(!items.length){ // không chọn gì cụ thể
    var w0=PRICE.web[1];items.push({type:'web',name:w0.name,price:w0.price,inc:w0.inc,why:['khách chưa rõ nhu cầu, lấy gói phổ biến làm mốc'],weeks:w0.weeks});weeks.push(w0.weeks);
  }
  if(unknownOnly)flags.push('Khách chọn “Chưa rõ”: gợi ý chỉ là mốc, cần gọi tư vấn để xác định nhu cầu.');

  // --- 4. Tổng chi phí ---
  var low=0,high=0;
  items.forEach(function(i){low+=i.range?r5(i.price*0.9):i.price;high+=i.range?r5(i.price*1.2):i.price;});
  addons.forEach(function(x){low+=x.price;high+=x.price;});
  if(addons.some(function(x){return x.est})||items.some(function(i){return i.range}))high=Math.max(high,low);
  var rush=false;
  weeks.sort(function(x,y){return y-x});
  var wk=weeks.length?weeks[0]+Math.ceil(weeks.slice(1).reduce(function(s,x){return s+x},0)*0.3):2;
  var wkHi=Math.ceil(wk*1.5);
  var dl=DEADLINE_WEEKS[a.thoi_gian]||99;
  if(dl<wk){rush=true;flags.push('Thời hạn khách muốn ('+dl+' tuần) ngắn hơn ước tính ('+wk+' tuần): đề xuất chia giai đoạn, ra mắt bản rút gọn trước, hoặc tính phí làm gấp.');}

  // --- 5. Gói vận hành ---
  var opsKey=backend?'tieuchuan':'coban';
  if(a.van_hanh==='tron_goi')opsKey='tieuchuan';
  if(a.su_co==='gio'||(a.su_co==='trong_ngay'&&a.van_hanh==='tron_goi'&&backend))opsKey='nangcao';
  if(a.van_hanh==='tu_quan'&&backend)notes.push('Khách muốn tự quản lý nhưng sản phẩm có máy chủ, cơ sở dữ liệu: vẫn khuyên tối thiểu gói Tiêu chuẩn để có cập nhật bảo mật và sao lưu.');
  var ops=PRICE.ops[opsKey];

  // --- 6. So với ngân sách ---
  var fit='unknown', b=BUDGET[a.ngan_sach];
  if(b){
    if(b[1]<low)fit='under';else if(b[0]>high*1.3)fit='over';else fit='ok';
    if(fit==='under')flags.push('Ngân sách ('+labelOf('ngan_sach',a.ngan_sach)+') thấp hơn ước tính ('+trieu(low)+'): đề xuất làm giai đoạn 1 gọn, bỏ chức năng chưa cần, hoặc hạ cấp gói.');
    if(fit==='over')notes.push('Ngân sách cao hơn ước tính: có thể đề xuất thêm thiết kế riêng, đa ngôn ngữ, gói vận hành cao hơn hoặc giai đoạn 2.');
  }

  // --- 7. Chấm điểm khách tiềm năng ---
  var score=0;
  if(a.vai_tro==='chu')score+=3;else if(a.vai_tro==='quanly')score+=2;else score+=1;
  if(fit==='ok'||fit==='over')score+=3;else if(fit==='unknown')score+=1;
  if(a.bat_dau==='ngay'||a.bat_dau==='thang_nay')score+=3;else if(a.bat_dau==='quy')score+=2;
  if(a.van_de&&a.van_de.length>30)score+=1;
  var lead=score>=8?'Nóng':score>=5?'Ấm':'Lạnh';

  return {items:items,addons:addons,low:low,high:high,weeks:wk,weeksHi:wkHi,ops:ops,opsKey:opsKey,notes:notes,ask:ask,flags:flags,fit:fit,lead:lead,score:score,rush:rush};
}

function labelOf(qid,v,a){
  for(var i=0;i<STEPS.length;i++)for(var j=0;j<STEPS[i].qs.length;j++){var q=STEPS[i].qs[j];if(q.id!==qid)continue;
    if(!q.opts)return v;
    var lists=typeof q.opts==='function'?[q.opts(a||{})].concat(Object.keys(SECTORS).map(function(k){return q.opts({linh_vuc:k})})):[q.opts];
    for(var m=0;m<lists.length;m++){var o=lists[m].filter(function(o){return o[0]===v})[0];if(o)return o[1];}
    return v;}
  return v;
}


/* ============================================================
   DỰNG FORM
   ============================================================ */
function val_(x, a) { return typeof x === 'function' ? x(a) : x; }

function stepById_(id) {
  for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i];
  throw new Error('Không có bước ' + id);
}

function qById_(id) {
  for (var i = 0; i < STEPS.length; i++)
    for (var j = 0; j < STEPS[i].qs.length; j++) if (STEPS[i].qs[j].id === id) return STEPS[i].qs[j];
  return null;
}

function labelsOf_(q, a) {
  return getOpts(q, a).map(function (o) { return o[1]; });
}

function taoGoogleForm() {
  var form = FormApp.create(FORM_TITLE);
  form.setDescription('Trả lời vài câu hỏi ngắn, khoảng 5 phút. Câu nào chưa rõ cứ chọn "Chưa rõ". ' +
    'Mình sẽ liên hệ lại với đề xuất phương án và chi phí tham khảo.')
    .setProgressBar(true)
    .setAllowResponseEdits(false)
    .setConfirmationMessage('Cảm ơn bạn! Mình đã nhận được thông tin và sẽ liên hệ trong 1 ngày làm việc. ' +
      'Cần gấp, nhắn Zalo ' + ZALO_TEXT + '.');
  try { form.setCollectEmail(false); } catch (e) {}
  try { form.setLimitOneResponsePerUser(false); } catch (e) {}

  var map = {};   // id câu hỏi trong form -> mã câu hỏi (qid)
  var pages = {}; // tên trang -> PageBreakItem

  function addQ(q, a, suffix, forceOptional) {
    var title = q.label + (suffix || '');
    var help = val_(q.h, a) || '';
    var item;
    if (q.type === 'radio') item = form.addMultipleChoiceItem().setChoiceValues(labelsOf_(q, a));
    else if (q.type === 'check') item = form.addCheckboxItem().setChoiceValues(labelsOf_(q, a));
    else if (q.type === 'textarea') item = form.addParagraphTextItem();
    else {
      item = form.addTextItem();
      if (q.type === 'email') {
        item.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
      }
    }
    item.setTitle(title);
    if (q.show) { help = (help ? help + ' ' : '') + '(Bỏ qua nếu không áp dụng.)'; }
    if (help) item.setHelpText(help);
    item.setRequired(!!q.req && !q.show && !forceOptional);
    map[item.getId()] = q.id;
    return item;
  }

  function addGate(qid, title, help) {
    var item = form.addMultipleChoiceItem().setTitle(title).setHelpText(help).setRequired(true);
    item.setChoiceValues(['Có', 'Không']); // thay bằng lựa chọn có chuyển trang ở cuối
    map[item.getId()] = qid;
    return item;
  }

  function page(name, title, desc) {
    var p = form.addPageBreakItem().setTitle(title);
    if (desc) p.setHelpText(desc);
    pages[name] = p;
    return p;
  }

  // ---------- Trang 1: thông tin (nằm trên trang đầu tiên của form) ----------
  var s1 = stepById_('s1');
  var linhItem = null;
  s1.qs.forEach(function (q) {
    var it = addQ(q, {}, '');
    if (q.id === 'linh_vuc') linhItem = it;
  });

  // ---------- Mỗi lĩnh vực: Mục tiêu > Hỏi hệ thống > Nghiệp vụ ----------
  var linhQ = qById_('linh_vuc');
  var sectors = linhQ.opts.map(function (o) { return o[0]; }); // gồm cả 'khac'
  var s2 = stepById_('s2'), s4 = stepById_('s4');
  var gateSysItems = {};
  sectors.forEach(function (sk) {
    var a = { linh_vuc: sk };
    var S = sec(a), suf = ' [' + S.name + ']';
    page('goals_' + sk, s2.title + suf, s2.desc);
    addQ(qById_('muc_tieu'), a, suf);
    page('gate_' + sk, 'Hỏi nhanh: phần mềm quản lý' + suf, 'Chỉ để chuyển bạn tới đúng phần câu hỏi.');
    gateSysItems[sk] = addGate('gate_sys', 'Bạn có cần phần mềm quản lý (CRM, quản lý vận hành) không?',
      'Chọn Không nếu bạn không chọn CRM hoặc quản lý vận hành ở phần Mục tiêu.');
    page('nv_' + sk, 'Nghiệp vụ cần quản lý' + suf, s4.desc);
    addQ(qById_('nghiep_vu'), a, suf);
    addQ(qById_('nghiep_vu_khac'), a, suf);
  });

  // ---------- Phần chung ----------
  page('sys', 'Quy mô hệ thống', 'Giúp ước lượng chi phí hệ thống.');
  s4.qs.forEach(function (q) {
    if (q.id === 'nghiep_vu' || q.id === 'nghiep_vu_khac') return;
    addQ(q, {}, '');
  });

  page('desc', 'Hiện trạng của bạn', 'Cho mình hiểu bối cảnh.');
  s2.qs.forEach(function (q) {
    if (q.id === 'muc_tieu') return;
    addQ(q, {}, '');
  });

  page('gateW', 'Hỏi nhanh: website', 'Chỉ để chuyển bạn tới đúng phần câu hỏi.');
  var gateW = addGate('gate_web', 'Bạn có cần làm website / landing page không?',
    'Chọn Không nếu bạn không chọn mục website, bán hàng online ở phần Mục tiêu.');
  var s3 = stepById_('s3');
  page('web', s3.title, s3.desc);
  s3.qs.forEach(function (q) { addQ(q, {}, ''); });

  page('gateM', 'Hỏi nhanh: Zalo Mini App', 'Chỉ để chuyển bạn tới đúng phần câu hỏi.');
  var gateM = addGate('gate_mini', 'Bạn có cần Zalo Mini App không?', 'Ứng dụng chạy ngay trong Zalo.');
  var s5 = stepById_('s5');
  page('mini', s5.title, s5.desc);
  s5.qs.forEach(function (q) { addQ(q, {}, ''); });

  var s6 = stepById_('s6');
  page('budget', s6.title, s6.desc);
  s6.qs.forEach(function (q) { addQ(q, {}, ''); });

  // ---------- Nối các trang với nhau ----------
  // Lệnh chuyển trang của một ngắt trang áp dụng cho trang đứng TRƯỚC nó (theo tài liệu Google).
  linhItem.setChoices(linhQ.opts.map(function (o) {
    return linhItem.createChoice(o[1], pages['goals_' + o[0]]);
  }));
  sectors.forEach(function (sk, i) {
    gateSysItems[sk].setChoices([
      gateSysItems[sk].createChoice('Có', pages['nv_' + sk]),
      gateSysItems[sk].createChoice('Không', pages.desc)
    ]);
    // trang nghiệp vụ của lĩnh vực này nằm ngay trước ngắt trang "goals" của lĩnh vực kế tiếp
    if (i < sectors.length - 1) pages['goals_' + sectors[i + 1]].setGoToPage(pages.sys);
  });
  gateW.setChoices([gateW.createChoice('Có', pages.web), gateW.createChoice('Không', pages.gateM)]);
  gateM.setChoices([gateM.createChoice('Có', pages.mini), gateM.createChoice('Không', pages.budget)]);

  // ---------- Sheet phản hồi, lưu bản đồ, trigger ----------
  var ss = SpreadsheetApp.create('Khảo sát nhu cầu: phản hồi');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  var props = PropertiesService.getScriptProperties();
  props.setProperty('map', JSON.stringify(map));
  props.setProperty('ssId', ss.getId());
  ScriptApp.newTrigger('onFormSubmit').forForm(form).onFormSubmit().create();
  try { if (form.setPublished) form.setPublished(true); } catch (e) {}
  try { if (form.setAcceptingResponses) form.setAcceptingResponses(true); } catch (e) {}

  Logger.log('GỬI CHO KHÁCH: ' + form.getPublishedUrl());
  Logger.log('Chỉnh sửa form: ' + form.getEditUrl());
  Logger.log('Google Sheet phản hồi: ' + ss.getUrl());
}

/* ============================================================
   KHI KHÁCH GỬI FORM: TÍNH GÓI, GIÁ, GỬI MAIL, GHI SHEET
   ============================================================ */
function codeOf_(qid, label) {
  var q = qById_(qid);
  if (!q || !q.opts) return label;
  var lists = typeof q.opts === 'function'
    ? [q.opts({})].concat(Object.keys(SECTORS).map(function (k) { return q.opts({ linh_vuc: k }); }))
    : [q.opts];
  for (var i = 0; i < lists.length; i++)
    for (var j = 0; j < lists[i].length; j++) if (lists[i][j][1] === label) return lists[i][j][0];
  return label;
}

var GATE_IDS_ = { gate_sys: 1, gate_web: 1, gate_mini: 1 };

function dongChoForm_(responseItems, map) {
  var a = {}, raw = [];
  responseItems.forEach(function (ir) {
    var qid = map[ir.getItem().getId()];
    var v = ir.getResponse();
    raw.push(ir.getItem().getTitle() + ': ' + (Array.isArray(v) ? v.join('; ') : v));
    if (!qid) return;
    var isEmpty = v == null || v === '' || (Array.isArray(v) && !v.length);
    if (isEmpty) return;
    if (GATE_IDS_[qid]) { a[qid] = v === 'Có' ? 'co' : 'khong'; return; }
    var q = qById_(qid);
    if (q && q.type === 'check') {
      a[qid] = (Array.isArray(v) ? v : [v]).map(function (x) { return codeOf_(qid, x); });
    } else {
      a[qid] = Array.isArray(v) ? codeOf_(qid, v[0]) : codeOf_(qid, v);
    }
  });
  // đồng bộ mục tiêu với các câu "có/không" để phân tích không bỏ sót
  var g = a.muc_tieu = a.muc_tieu || [];
  var drop = function (list) { a.muc_tieu = a.muc_tieu.filter(function (k) { return list.indexOf(k) < 0; }); };
  if (a.gate_web === 'khong') drop(['landing', 'web', 'cms', 'shop']);
  if (a.gate_mini === 'khong') drop(['mini']);
  if (a.gate_sys === 'khong') drop(['crm', 'ql']);
  if (a.gate_web === 'co' && !wantsWeb(a)) a.muc_tieu.push('web');
  if (a.gate_mini === 'co' && !has(a, 'muc_tieu', 'mini')) a.muc_tieu.push('mini');
  if (a.gate_sys === 'co' && !wantsSys(a)) a.muc_tieu.push('crm');
  if (!a.muc_tieu.length) a.muc_tieu = ['unknown'];
  return { a: a, raw: raw };
}

function soanThu_(a, r, raw) {
  var L = [];
  L.push('Phân loại khách: ' + r.lead + ' (' + r.score + '/10)');
  L.push('Liên hệ: ' + (a.ho_ten || '') + ' · ' + (a.sdt || '') + (a.email ? ' · ' + a.email : ''));
  L.push('Doanh nghiệp: ' + (a.cong_ty || '') + ' · ' + (a.linh_vuc ? labelOf('linh_vuc', a.linh_vuc, a) : ''));
  L.push('');
  L.push('GỢI Ý SƠ BỘ');
  r.items.forEach(function (i) { L.push('- ' + i.name + (i.why.length ? ' (' + i.why.join('; ') + ')' : '')); });
  r.addons.forEach(function (x) { L.push('  + ' + x.name + (x.est ? ' (ước tính, cần xác nhận)' : '')); });
  L.push('Chi phí chưa VAT: ' + (r.low === r.high ? money(r.low) : money(r.low) + ' đến ' + money(r.high)));
  L.push('Đã gồm VAT ' + PRICE.vat * 100 + '%: ' + money(Math.round(r.low * (1 + PRICE.vat))) +
    (r.low === r.high ? '' : ' đến ' + money(Math.round(r.high * (1 + PRICE.vat)))));
  L.push('Thời gian dự kiến: ' + r.weeks + ' đến ' + r.weeksHi + ' tuần');
  L.push('Vận hành: ' + r.ops.name + ', khoảng ' + money(Math.round(r.ops.fee / 1000) * 1000) + '/tháng (' + r.ops.sla + ')');
  if (a.ngan_sach) L.push('Ngân sách khách: ' + labelOf('ngan_sach', a.ngan_sach, a) + ' (' +
    { ok: 'phù hợp', under: 'thấp hơn ước tính', over: 'cao hơn ước tính', unknown: 'chưa rõ' }[r.fit] + ')');
  if (r.flags.length) { L.push(''); L.push('CẢNH BÁO'); r.flags.forEach(function (x) { L.push('- ' + x); }); }
  if (r.notes.length) { L.push(''); L.push('GHI CHÚ ĐỊNH GIÁ'); r.notes.forEach(function (x) { L.push('- ' + x); }); }
  if (r.ask.length) { L.push(''); L.push('CÂU CẦN HỎI LẠI KHI GỌI'); r.ask.forEach(function (x) { L.push('- ' + x); }); }
  L.push('');
  L.push('TOÀN BỘ CÂU TRẢ LỜI');
  raw.forEach(function (x) { L.push(x); });
  return L.join('\n');
}

function ghiSheetPhanTich_(a, r) {
  var id = PropertiesService.getScriptProperties().getProperty('ssId');
  if (!id) return;
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName('PhanTich') || ss.insertSheet('PhanTich');
  if (sh.getLastRow() === 0) {
    sh.appendRow(['thoi_gian', 'ho_ten', 'cong_ty', 'sdt', 'email', 'linh_vuc', 'goi_de_xuat',
      'tong_thap', 'tong_cao', 'van_hanh', 'phan_loai', 'canh_bao']);
    sh.setFrozenRows(1);
  }
  var row = sh.getLastRow() + 1;
  sh.getRange(row, 4).setNumberFormat('@'); // giữ số 0 đầu của số điện thoại
  sh.getRange(row, 1, 1, 12).setValues([[new Date(), a.ho_ten || '', a.cong_ty || '', a.sdt || '', a.email || '',
    a.linh_vuc ? labelOf('linh_vuc', a.linh_vuc, a) : '',
    r.items.map(function (i) { return i.name; }).concat(r.addons.map(function (x) { return x.name; })).join('; '),
    r.low, r.high, r.ops.name, r.lead, r.flags.join(' | ')]]);
}

function onFormSubmit(e) {
  var map = JSON.parse(PropertiesService.getScriptProperties().getProperty('map') || '{}');
  var d = dongChoForm_(e.response.getItemResponses(), map);
  var r = analyze(d.a);
  try { ghiSheetPhanTich_(d.a, r); } catch (err) { Logger.log('Lỗi ghi sheet: ' + err); }
  if (NOTIFY_EMAIL) {
    try {
      var opts = { name: 'Khảo sát nhu cầu' };
      if (d.a.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.a.email)) opts.replyTo = d.a.email;
      MailApp.sendEmail(NOTIFY_EMAIL, 'Khảo sát mới (' + r.lead + '): ' + (d.a.cong_ty || d.a.ho_ten || ''),
        soanThu_(d.a, r, d.raw), opts);
    } catch (err) { Logger.log('Lỗi gửi mail: ' + err); }
  }
}

/** Chạy thử phần tính gói và giá bằng một khách mẫu, xem kết quả trong Nhật ký. */
function kiemTraPhanTich() {
  var a = { ho_ten: 'Nguyễn Văn A', cong_ty: 'Trung tâm Anh ngữ ABC', sdt: '0901234567', vai_tro: 'chu',
    linh_vuc: 'giao_duc', muc_tieu: ['cms', 'ql', 'mini'], nguoi_dung: 'ca_hai', so_trang: '6-15', cap_nhat: 'thang',
    giao_dien: 'mau', so_user: '6-20', nghiep_vu: ['hoc_vien', 'lich', 'diem_danh', 'thu_chi'], chi_nhanh: '2-3',
    mini_cn: ['gioi_thieu', 'dat_lich'], ngan_sach: '100-200', thoi_gian: '2-3thang', bat_dau: 'thang_nay',
    van_hanh: 'co_ban', su_co: 'trong_ngay' };
  Logger.log(soanThu_(a, analyze(a), ['(câu trả lời mẫu)']));
}
