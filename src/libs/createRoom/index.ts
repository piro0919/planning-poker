/**
 * 部屋を作った本人だけが、この印を持って最初の接続に来る。
 * HomePage が書き、RoomPage が一度だけ読んで消す。
 */
const CREATE_ROOM_KEY = "create-room";

/**
 * これから入る部屋を、自分が作ったものとして印を付ける。
 *
 * @param {string} roomId 作った部屋の ID。
 */
export function markRoomCreated(roomId: string): void {
  window.sessionStorage.setItem(CREATE_ROOM_KEY, roomId);
}

/**
 * 印を読んで消す。読めるのは一度だけ。
 *
 * @param {string} roomId 入ろうとしている部屋の ID。
 * @return {boolean} その部屋を自分が作ったなら true。
 */
export function takeRoomCreated(roomId: string): boolean {
  const created = window.sessionStorage.getItem(CREATE_ROOM_KEY) === roomId;

  window.sessionStorage.removeItem(CREATE_ROOM_KEY);

  return created;
}
