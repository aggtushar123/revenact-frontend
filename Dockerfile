FROM node:22.13.1

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build

CMD ["bash"]
