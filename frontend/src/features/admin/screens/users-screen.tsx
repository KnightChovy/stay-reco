'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Eye,
  MoreVertical,
  Plus,
  RefreshCw,
  Settings2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

const users = [
  [
    'USR-84920',
    'Nguyễn Minh Anh',
    'minh.anh@email.vn',
    '0912 845 291',
    'Khách hàng',
    'Toàn hệ thống (B2C)',
    '12 lượt đặt phòng hoàn tất',
    '14/10/2023',
    'Đăng nhập 2 giờ trước',
    'Hoạt động',
    'Tier Vàng',
  ],
  [
    'STF-1049',
    'Lê Tấn Phát',
    'tanphat.le@annhienhotel.vn',
    '0905 119 284',
    'Nhân viên',
    'An Nhiên Riverside Hotel',
    'Tổ Lễ tân ca ngày',
    '03/01/2024',
    'Đang trực tuyến',
    'Hoạt động',
    'STF-1049',
  ],
  [
    'USR-PTR-0042',
    'Võ Hoàng Long',
    'long.vo@annhienriverside.vn',
    '0983 992 104',
    'Đối tác (Owner)',
    'An Nhiên Riverside Hotel',
    'Chủ sở hữu & Người đại diện',
    '19/08/2022',
    'Hợp đồng đối tác 3 năm',
    'Hoạt động',
    'Verified Partner',
  ],
  [
    'STF-2890',
    'Bùi Thảo Linh',
    'thaolinh.mkt@annhienhotel.vn',
    '0935 482 178',
    'Nhân viên',
    'An Nhiên Riverside Hotel',
    'Trưởng nhóm Marketing & OTA',
    '11/05/2023',
    'Đăng nhập hôm qua',
    'Hoạt động',
    'STF-2890',
  ],
  [
    'ADM-008',
    'Phan Quốc Đạt',
    'dat.pq@stayreco.vn',
    '0977 239 881',
    'Platform Manager',
    'Ban Vận hành StayReco',
    'Giám sát Hệ thống Trung ương',
    '15/02/2022',
    'Đang trực tuyến (Session #48)',
    'Hoạt động',
    'HQ Operations',
  ],
  [
    'PTR-1102',
    'Đặng Hữu Trí',
    'huutri@phohoaivilla.com',
    '0944 602 918',
    'Đối tác (Chủ Villa)',
    'Phố Hoài Heritage Villa',
    'Chờ xét duyệt giấy phép PCCC',
    'Hôm qua, 16:40',
    'Gửi hồ sơ lúc 16:45',
    'Chờ duyệt xác minh',
    'Mới đăng ký',
  ],
] as const;
const roles = [
  'Tất cả vai trò',
  'Khách hàng (Customer)',
  'Đối tác (Partner)',
  'Nhân viên (Staff)',
  'Platform Manager',
  'Admin',
];
const metrics = [
  ['TỔNG TÀI KHOẢN', '48.290', '+14.2%'],
  ['KHÁCH HÀNG (B2C)', '47.120', '97.6%'],
  ['ĐỐI TÁC KHÁCH SẠN', '980', 'B2B'],
  ['NHÂN VIÊN HOTEL', '182', '54 units'],
  ['QUẢN TRỊ HỆ THỐNG', '12', '8 Mgr / 4 Adm'],
  ['CHỜ XÉT DUYỆT', '24', 'Cần xử lý'],
];

export function UsersPage({ notify }: { notify: (message: string) => void }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('Tất cả vai trò');
  const [status, setStatus] = useState('');
  const [unit, setUnit] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      users.filter(
        (user) =>
          `${user[1]} ${user[2]} ${user[3]} ${user[0]} ${user[4]}`
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (!status || user[9] === status) &&
          (!unit || user[5] === unit) &&
          (role === 'Tất cả vai trò' || user[4].includes(role.split(' ')[0])),
      ),
    [query, role, status, unit],
  );
  const toggleAll = (checked: boolean) =>
    setSelected(checked ? filtered.map((item) => item[0]) : []);
  return (
    <div className="space-y-6 pt-4">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              A02 // Identity & Access Layer
            </span>
            <i className="size-1.5 rounded-full bg-input" />
            <span className="font-mono text-xs text-muted-foreground">
              RBAC v3.4.1
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Quản lý Người dùng & Tài khoản Hệ thống
          </h1>
          <p className="mt-1 max-w-3xl text-xs text-muted-foreground lg:text-sm">
            Quản lý 48.290 tài khoản bao gồm Khách hàng, Nhân viên, Chủ khách
            sạn, Quản lý nền tảng và Quản trị viên trên toàn hệ sinh thái
            StayReco.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="h-11 rounded-xl border-0 bg-white shadow-sm"
            onClick={() => notify('Đã chuẩn bị danh sách CSV mẫu.')}
          >
            <Download size={18} />
            Xuất danh sách CSV
          </Button>
          <Button
            className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-(--sr-primary-hover)"
            onClick={() => setOpen(true)}
          >
            <Plus size={18} />
            Thêm tài khoản mới
          </Button>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {metrics.map(([label, value, hint], index) => (
          <Card
            key={label}
            className={`rounded-2xl border-0 p-3.5 shadow-sm ${index === 5 ? 'bg-warning-soft' : 'bg-card'}`}
          >
            <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
              <span>{label}</span>
              <Users
                size={18}
                className={
                  index === 5 ? 'text-brand-accent' : 'text-primary'
                }
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <strong
                className={
                  index === 5 ? 'text-xl text-brand-accent' : 'text-xl'
                }
              >
                {value}
              </strong>
              <span className="text-[10px] text-success">
                {hint}
              </span>
            </div>
            <i
              className={`mt-2 block h-1 rounded-full ${index === 5 ? 'w-[60%] bg-brand-accent' : 'w-full bg-primary'}`}
            />
          </Card>
        ))}
      </section>
      <Card className="rounded-2xl border-0 bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 flex-1 rounded-xl bg-muted"
            placeholder="Tìm kiếm theo Tên, Email, Số điện thoại (09xx) hoặc ID tài khoản (USR-xxxx)..."
          />
          <NativeSelect
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full md:w-64 [&>select]:h-11 [&>select]:bg-muted"
          >
            <option value="">Tất cả Khách sạn / Đơn vị</option>
            <option>An Nhiên Riverside Hotel</option>
            <option>Phố Hoài Heritage Villa</option>
            <option>Ban Vận hành StayReco</option>
          </NativeSelect>
          <NativeSelect
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full md:w-52 [&>select]:h-11 [&>select]:bg-muted"
          >
            <option value="">Tất cả Trạng thái</option>
            <option>Hoạt động</option>
            <option>Chờ duyệt xác minh</option>
          </NativeSelect>
        </div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto">
          {roles.map((item) => (
            <Button
              key={item}
              variant="ghost"
              onClick={() => setRole(item)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${role === item ? 'bg-[#013758] text-white hover:bg-[#013758]' : 'bg-[#f1f3f9] text-[#42474e]'}`}
            >
              {item}
              {item === 'Tất cả vai trò' && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 font-mono text-[10px]">
                  48.290
                </span>
              )}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                selected.length === filtered.length && filtered.length > 0
              }
              onCheckedChange={(value) => toggleAll(Boolean(value))}
            />
            <span className="text-xs text-[#72777e]">
              Chọn tất cả trang này ({filtered.length})
            </span>
            <span className="hidden text-xs text-[#42474e] md:inline">
              Đang lọc:{' '}
              <strong className="text-[#013758]">
                Toàn bộ nhân sự & khách hàng
              </strong>
            </span>
          </div>
          <div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => notify('Đã tải lại bảng dữ liệu.')}
            >
              <RefreshCw size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => notify('Cấu hình cột đang dùng bản mẫu.')}
            >
              <Settings2 size={18} />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-262.5 text-left text-xs">
            <thead className="bg-[#f1f3f9] uppercase tracking-wider text-[#72777e]">
              <tr>
                <th className="p-4" />
                <th className="p-4">Người dùng & Định danh</th>
                <th className="p-4">Vai trò (Role)</th>
                <th className="p-4">Đơn vị / Khách sạn gắn kèm</th>
                <th className="p-4">Ngày tham gia</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr
                  key={user[0]}
                  className="border-t border-[#eceef4] hover:bg-[#f1f3f9]/70"
                >
                  <td className="p-4">
                    <Checkbox
                      checked={selected.includes(user[0])}
                      onCheckedChange={(value) =>
                        setSelected(
                          value
                            ? [...selected, user[0]]
                            : selected.filter((id) => id !== user[0]),
                        )
                      }
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <strong className="text-sm">{user[1]}</strong>
                      <span className="ml-2 rounded bg-[#f1f3f9] px-1.5 py-0.5 font-mono text-[10px]">
                        {user[10]}
                      </span>
                      <p className="mt-1 text-[#42474e]">{user[2]}</p>
                      <p className="font-mono text-[11px] text-[#72777e]">
                        {user[3]} · {user[0]}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-[#cde5ff] px-2.5 py-1 font-semibold text-[#001d32]">
                      {user[4]}
                    </span>
                  </td>
                  <td className="p-4">
                    <strong>{user[5]}</strong>
                    <p className="mt-1 text-[#72777e]">{user[6]}</p>
                  </td>
                  <td className="p-4">
                    <strong className="font-mono">{user[7]}</strong>
                    <p className="mt-1 text-[#72777e]">{user[8]}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 font-semibold ${user[9] === 'Hoạt động' ? 'bg-[#bceecf]/40 text-[#0b3c27]' : 'bg-[#ffdbd0] text-[#783520]'}`}
                    >
                      {user[9]}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/admin/users/${user[0]}`}
                      className="inline-flex"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Xem hồ sơ"
                      >
                        <Eye size={18} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        notify(`Quyền của ${user[1]} đang ở chế độ mock.`)
                      }
                    >
                      <Settings2 size={18} />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical size={18} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-col items-center justify-between gap-4 px-5 py-4 text-xs text-[#72777e] sm:flex-row">
          <span>
            Hiển thị 10 trên tổng{' '}
            <strong className="font-mono text-[#181c20]">48.290</strong> tài
            khoản
          </span>
          <span className="rounded-lg bg-[#013758] px-3 py-2 font-semibold text-white">
            1
          </span>
        </footer>
      </Card>
      <CreateUserDialog open={open} onOpenChange={setOpen} notify={notify} />
    </div>
  );
}
function CreateUserDialog({
  open,
  onOpenChange,
  notify,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notify: (message: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0">
        <DialogHeader className="bg-[#f1f3f9] px-6 py-4">
          <DialogTitle>Tạo tài khoản người dùng mới</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            onOpenChange(false);
            notify('Đã tạo tài khoản mẫu và gửi lời mời.');
          }}
        >
          <Input required placeholder="Ví dụ: Trần Hoàng Nam" />
          <div className="grid grid-cols-2 gap-3">
            <Input required type="email" placeholder="name@domain.vn" />
            <Input required type="tel" placeholder="0905 xxx xxx" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NativeSelect>
              <option>Khách hàng (Customer)</option>
              <option>Nhân viên khách sạn (Staff)</option>
              <option>Đối tác / Chủ khách sạn (Partner)</option>
            </NativeSelect>
            <NativeSelect>
              <option>Không gắn (Khách lẻ/Trực thuộc)</option>
              <option>An Nhiên Riverside Hotel</option>
            </NativeSelect>
          </div>
          <label className="flex gap-2 rounded-xl bg-[#f1f3f9] p-3 text-xs">
            <Checkbox defaultChecked />
            Gửi email kèm đường dẫn thiết lập mật khẩu lần đầu và mã xác thực
            bảo mật 2 lớp (2FA).
          </label>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" className="bg-[#013758] text-white">
              Xác nhận tạo tài khoản
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
