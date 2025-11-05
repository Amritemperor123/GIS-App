"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const users_1 = __importDefault(require("./routes/users"));
const images_1 = __importDefault(require("./routes/images"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(body_parser_1.default.json({ limit: '500mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '500mb', extended: true, parameterLimit: 50000 }));
// Serve static files from the 'uploads' directory
app.use('/db/images', express_1.default.static(path_1.default.join(__dirname, 'db/images')));
// Root endpoint
app.get('/', (req, res) => {
    res.send('GIS App Backend is running!');
});
// API routes
app.use('/api/auth', auth_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/users', users_1.default);
app.use('/api/images', images_1.default);
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
