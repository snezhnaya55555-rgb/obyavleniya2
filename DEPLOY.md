# Инструкция по деплою на GitHub Pages

## Вариант 1: Использование GitHub Actions (рекомендуется)

1. **Создайте репозиторий на GitHub** (если еще не создан)

2. **Запушите код:**
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/snezhnaya55555-rgb/obyavleniya.git
git push -u origin main
```

3. **Включите GitHub Pages:**
   - Перейдите в Settings → Pages
   - В разделе "Source" выберите: **GitHub Actions**
   - Сохраните

4. **Проверьте workflow:**
   - Перейдите в Actions → выберите workflow "Build and Deploy"
   - Убедитесь, что он выполнился успешно

5. **Сайт будет доступен по адресу:**
   - `https://snezhnaya55555-rgb.github.io/obyavleniya/` (если репозиторий называется obyavleniya)
   - Или `https://snezhnaya55555-rgb.github.io/` (если это ваш user site)

## Вариант 2: Ручной деплой

Если Actions не работает, можно задеплоить вручную:

1. **Соберите проект локально:**
```bash
npm run build
```

2. **Создайте ветку gh-pages и задеплойте:**
```bash
git checkout -b gh-pages
git add dist
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

3. **В настройках GitHub Pages выберите:**
   - Source: `gh-pages` branch
   - Folder: `/ (root)`

## Проверка

После деплоя подождите 1-2 минуты и проверьте:
- `https://snezhnaya55555-rgb.github.io/obyavleniya/` (или ваш URL)

Если видите 404:
- Проверьте, что workflow выполнился успешно в Actions
- Убедитесь, что в Settings → Pages выбрано правильное source
- Проверьте, что файлы есть в ветке gh-pages

