export function extractPublicId(url: string): string {
  try {
    // Lấy phần sau "/upload/"
    const parts = url.split('/upload/');
    if (parts.length < 2) return '';

    // Bỏ đi version (vd: v1757492526)
    const path = parts[1].split('/');
    if (path[0].startsWith('v')) {
      path.shift(); // bỏ version
    }

    // Lấy toàn bộ còn lại, bỏ extension
    const publicIdWithExt = path.join('/');
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));

    return publicId;
  } catch {
    return '';
  }
}
