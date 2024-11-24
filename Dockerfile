# Використовуємо офіційний образ Node.js
FROM node:20-alpine

# Встановлюємо робочу директорію
WORKDIR /usr/src/app

# Копіюємо файли package.json та package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код програми до контейнера
COPY . .

# Відкриваємо порт для доступу до програми
EXPOSE 3000

# Запускаємо сервер
CMD ["node", "app.js"]
