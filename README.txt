HIMWIITA NKOSILATI MUSIC — VERSION 3

This version includes the 10 songs supplied in "full songs.zip" and connects the public music page to a central server/database file.

Public website:
http://localhost:3000

Admin:
http://localhost:3000/admin.html

Default admin:
Username: admin
Password: nkosilati1

ADMIN FEATURES
- Upload songs
- Create albums + covers
- Upload videos
- Add lyrics
- Delete content
- Public site automatically reads the central content library

The 10 supplied songs are already installed under uploads/audio and appear in Tushoma Ndiwe.

RUN:
1. Install Node.js 18+.
2. Extract ZIP.
3. Double-click START_SERVER.bat, or run npm start.
4. Open http://localhost:3000

LAN:
Other computers on the same network can use the server PC's IP, for example http://192.168.1.100:3000.

IMPORTANT FOR PUBLIC DEPLOYMENT:
Change the default admin password using environment variables, and add HTTPS, a production database, backups, rate limiting, secure session storage, upload limits and other production security controls.
