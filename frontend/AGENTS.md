<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Quy tắc cấu trúc & phát triển dự án StayReco (Project Rules)

1. **Duy nhất 1 thư mục Common Component (`src/components/common/`)**: 
   - Tất cả các common component tái sử dụng (Filter, Breadcrumb, Card, Modal, Navbar, Sidebar, Pagination, Search, Table, v.v.) BẮT BUỘC đặt duy nhất tại `src/components/common/`.
   - KHÔNG tạo thêm bất kỳ thư mục `src/common/` hay `common/` nào khác.

2. **Duy nhất 1 thư mục Shadcn UI Primitives (`src/components/ui/`)**: 
   - Tất cả UI primitive (Button, Badge, Input, Select, Dialog, Popover, Checkbox, Avatar, Calendar, v.v.) BẮT BUỘC nằm tại `src/components/ui/`.
   - KHÔNG tạo thư mục `ui/` hay các file UI rời rạc bên ngoài `src/`.

3. **Quy định vị trí Code & File trong `src/`**:
   - Toàn bộ source code dự án BẮT BUỘC nằm trong `src/` (trừ `public/` và các file config ở thư mục gốc như `next.config.ts`, `tsconfig.json`, `package.json`, `components.json`).
   - Cấu trúc thư mục chuẩn:
     - `src/app/`: Các trang giao diện (sử dụng Route Groups `(actors)`, `(landing-page)`, `(auth)`).
     - `src/components/common/`: Component dùng chung.
     - `src/components/ui/`: Shadcn UI primitives.
     - `src/components/features/`: Component giao diện cho các phân hệ cụ thể (account, admin, staff).
     - `src/components/layout/`: Layout chung (Header, Footer).
     - `src/services/`: Service gọi API.
     - `src/stores/`: Zustand state management.
     - `src/lib/`: Các hàm utility (`utils.ts`, `auth-store`, v.v.).
     - `src/hooks/`: Custom React hooks.
     - `src/types/`: Typescript types & interfaces.
     - `src/config/` & `src/constants/`: Configuration & constants.
     - `src/provider/`: React Query & Context Providers.

4. **Ưu tiên Tái sử dụng & Audit UI/UX**:
   - Luôn kiểm tra component sẵn có trong `src/components/common/` và `src/components/ui/` trước khi viết mới.
   - Luôn audit kiểm tra UI/UX, độ tương phản màu sắc, kích thước button (`h-9`/`h-10`) và gắn thẻ `<Link>` đầy đủ cho các hành động chuyển trang.

