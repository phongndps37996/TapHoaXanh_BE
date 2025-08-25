# Test Order API Changes

## Vấn đề đã được sửa:
- **Trước**: Order API nhận `userId` từ request body, có thể bị giả mạo
- **Sau**: Order API lấy `userId` từ JWT token, đảm bảo tính bảo mật

## Các thay đổi đã thực hiện:

### 1. CreateOrderDto (src/order/dto/create-order.dto.ts)
- ✅ Bỏ trường `userId` 
- ✅ Chỉ giữ lại các trường cần thiết: `total_price`, `note`, `order_code`, `status`

### 2. OrderService (src/order/order.service.ts)
- ✅ Sửa method `create()` để nhận `userId` từ tham số thay vì từ DTO
- ✅ Sử dụng `userId` được truyền vào để tìm user

### 3. OrderController (src/order/order.controller.ts)
- ✅ Thêm `@Req() req: any` để lấy request object
- ✅ Lấy `userId` từ JWT token: `const userId = req.user.sub;`
- ✅ Truyền `userId` vào service: `this.orderService.create(createOrderDto, userId)`

## Cách hoạt động mới:

1. **Client gửi request** với JWT token trong header `Authorization: Bearer <token>`
2. **JwtGuard** xác thực token và gắn user info vào `req.user`
3. **Controller** lấy `userId` từ `req.user.sub` (JWT payload)
4. **Service** sử dụng `userId` này để tìm user và tạo order
5. **Kết quả**: Order luôn được tạo cho đúng user đã đăng nhập

## Test API:

### Request mới (không cần userId):
```bash
curl -X 'POST' 'http://localhost:5000/api/order' \
  -H 'accept: */*' \
  -H 'Authorization: Bearer <JWT_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
    "total_price": 500000,
    "note": "Giao trong giờ hành chính",
    "order_code": "ORD123457",
    "status": "PENDING"
  }'
```

### Kết quả mong đợi:
- Order được tạo cho đúng user đã đăng nhập
- Không còn bị lấy nhầm user khác
- Tăng tính bảo mật cho API

## Lưu ý:
- Client không cần gửi `userId` trong request body nữa
- JWT token phải hợp lệ và chưa hết hạn
- User ID được lấy tự động từ token, không thể bị giả mạo
