import path from 'path';
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import router from './router/requests.route.js';

const staticDir = path.join(process.cwd(), 'public');
const app = express();

morgan.token('body', (req) => JSON.stringify({ body: req.body }));
app.use(morgan(':method :url :body'));
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

app.use(router);

// express static middleware
app.use(express.static(staticDir));

app.listen(8080, () => {
  console.log('Server listening...');
});
