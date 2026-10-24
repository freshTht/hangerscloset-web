import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <article className="border round">
      <div className="row items-center gap">
        <i className="extra primary-text">home</i>
        <div className="max">
          <h5 className="no-margin bold">หน้าหลัก</h5>
          <p className="no-margin secondary-text">ยินดีต้อนรับสู่ Hanger's Closet</p>
        </div>
      </div>
      <div className="space"></div>
      <p>
        หน้าหลัก — สร้างแดชบอร์ด ฟีดกิจกรรมล่าสุด หรือไฮไลต์ชุดโปรดได้ที่นี่
      </p>
      <div className="space"></div>
      <div className="grid">
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">ภาพรวมรวดเร็ว</h6>
            <p className="secondary-text">สรุปจำนวนชุดและสถานะคลังเสื้อผ้า</p>
          </div>
        </div>
        <div className="s12 m6">
          <div className="card fill surface-container-low round padding">
            <h6 className="bold">เพิ่มล่าสุด</h6>
            <p className="secondary-text">ชุดที่เพิ่งลงทะเบียนเข้าระบบล่าสุด</p>
          </div>
        </div>
      </div>
    </article>
  );
};
