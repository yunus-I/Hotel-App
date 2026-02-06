export function renderHeader(hotelName = 'Hotel') {
  return `
    <div class="p-4 bg-white shadow">
      <h1 class="text-lg font-bold">${hotelName}</h1>
    </div>
  `;
}

export default renderHeader;
