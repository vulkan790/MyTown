# Предисловие

В данном документе собрана информация о всех конечных точках, к которым
можно достучаться со стороны frontend.

У каждой точки перед URL стоит принимаемый HTTP метод, например: GET, POST
и другие. Следующим параграфом идёт её описание. В заголовках 3-го уровня
указаны входные и выходные параметры в формате JSON: headers (заголовки),
query (всё, что идет после вопроса в конце URL), path (обозначает
заглушку в URL, типа `/:id`), body (тело запроса).

Перед схемой ответа идёт статус код, обозначающий успех или неудачное
выполнение запроса. 200 - ок, 404 - не найдено и т.п. (см. http status code).

# Endpoints

## GET /api/problems

Получить список всех происшествий требующих решения, решаемых в данный
момент или решенных.

### Request

**Query**
```json
{
  "page": 1,
  "limit": 12
}
```

### Response

**200 OK**
```json
{
  "page": 1,
  "total": 123, // всего происшествий

  "problems": [
    {
      "id": 123,
      "title": "Трубы прорвало",
      "description": "Ужас, просто ужас, ассинезатор не справляется, помогите!",
      "address": "ул. Пушкина, д. Колотушкина",
      "images": ["https://host.com/uploads/image.jpg"],
      "status": "wait_for_solve", // "wait_for_solve" | "solving" | "solved"
      "votes": 123, // could be negative (?)
      "author": {
        "id": 12,
        "firstName": "Кристина",
        "avatarUrl": "https://images.com/uploads/avatar.webp"
      }
    }
  ]
}
```

## GET /api/problems/:id

Подробная информация о проблеме.

### Request

**Path**
```json
{
  "id": 123
}
```

### Response

**200 OK**
```json
{
  "id": 123,
  "title": "Трубы прорвало",
  "description": "Ужас, просто ужас, ассинезатор не справляется, помогите!",
  "address": "ул. Пушкина, д. Колотушкина",
  "images": ["https://host.com/uploads/image.jpg"],
  "status": "wait_for_solve", // "wait_for_solve" | "solving" | "solved"
  "votes": 123, // could be negative (?)
  "author": {
    "id": 12,
    "firstName": "Кристина",
    "avatarUrl": "https://images.com/uploads/avatar.webp"
  },

  "comments": [
    {
      "id": 123,
      "author": {
        "firstName": "Светлана",
        "lastName": "Камбулова",
        "middleName": "Отчество",
        "avatarUrl": "https://host.com/uploads/avatar.png"
      },
      "content": "Господа граждане, работаем!"
    }
  ]
}
```

**404 Not Found**
```json
// empty
```

## GET /api/problems/hot

Список актуальных (горячих) проблем, т.е. набравших наибольшее 
кол-во голосов. По статусу - решаемые или требующие решения.

### Request

Не принимает на вход параметры

### Response

**200 OK**
```json
[
  {
    "id": 123,
    "title": "Трубы прорвало",
    "description": "Ужас, просто ужас, ассинезатор не справляется, помогите!",
    "address": "ул. Пушкина, д. Колотушкина",
    "images": ["https://host.com/uploads/image.jpg"],
    "status": "wait_for_solve", // "wait_for_solve" | "solving" | "solved"
    "votes": 123, // could be negative (?)
    "author": {
      "id": 12,
      "firstName": "Кристина",
      "avatarUrl": "https://images.com/uploads/avatar.webp"
    }
  }
]
```

## POST /api/auth/login

Вход пользователя через почту и пароль.

### Request

**Body**
```json
{
  "email": "asd@mail.ru",
  "password": "PasswordSecret!123"
}
```

### Response

**200 OK**
```json
{
  "accessToken": "jwt-token-here"
}
```

**401 Unauthorized**
```json
{
  "error": "invalid_email_or_password"
}
```

## POST /api/auth/register

Регистрация пользователя

### Request

**Body**
```json
{
  "email": "mail@mail.ru",
  "password": "SecretPassword!2",

  "firstName": "Борис",
  "lastName": "Шевцев",
  "middleName": "Константинович", // может быть пустым (отчество)
  "gender": "male" // "male" | "female"
}
```

### Response

**200 OK**
```json
{
  "accessToken": "jwt-token-here"
}
```

**400 Bad Request**
```json
{
  "error": "invalid_form"
}
```

## GET /api/users/me

Получить информацию о текущем пользователе.

### Request

**Headers**
```json
{
  "Authorization": "Bearer jwt-token"
}
```

### Response

**200 OK**
```json
{
  "id": 123,
  "email": "mail@mail.ru",

  "firstName": "Борис",
  "lastName": "Шевцев",
  "middleName": "",
  "gender": "male",
  
  "role": "user", // "user" | "admin" | "gov" | "mod"
  "problems": [ // для модерации и муниципалитета применяются соответствующие фильтры
    {
      "id": 123,
      "title": "Трубы прорвало",
      "description": "Ужас, просто ужас, ассинезатор не справляется, помогите!",
      "address": "ул. Пушкина, д. Колотушкина",
      "images": ["https://host.com/uploads/image.jpg"],
      "status": "wait_for_solve", // "wait_for_solve" | "solving" | "solved" | "rejected" | "on_moderation"
      "votes": 123 // could be negative (?)
    }
  ]
}
```

**401 Unauthorized**
```json
// empty
```

## POST /api/problems

Сообщить о проблеме.

### Request

**Headers**
```json
{
  "authorization": "Bearer jwt-token"
}
```

**Body**  
Тип отправляемых данных - `multipart/form-data`.

В поле `data` - инфа о проблеме в следующем формате
```json
{
  "title": "По небу летят журавли",
  "description": "Всё, смерть, апокалипсис неминуем",
  "address": "ул. Пальмиро-Тольяти"
}
```

### Response

**201 Created**
```json
{
  "id": 124
}
```

**400 Bad Request**
```json
{
  "error": "" // "too_large_files" | json fields validation errors
}
```

**401 Unauthorized**
```json
// empty
```

## POST /api/problems/:id/moderation

Изменение статуса проблемы модераторами

### Request

**Headers**
```json
{
  "authorization": "Bearer jwt-token"
}
```

**Path**
```json
{
  "id": 123
}
```

**Body**
```json
{
  "solution": "" // "reject" | "approve"
}
```

### Response

**204 No Content**
```json
// empty (success)
```

**401 Unauthorized**
```json
// empty
```

**403 Forbidden**
```json
// empty
```

**404 Not Found**
```json
// empty
```

## POST /api/problems/:id/town

Взять проблему в работу (для муниципалитета).

### Request

**Headers**
```json
{
  "auhtorization": "Bearer jwt-token"
}
```

**Path**
```json
{
  "id": 123
}
```

**Body**
```json
{
  "action": "" // "claim" | "resolve"
}
```

### Response

**204 No Content**
```json
// empty (success)
```

**401 Unaothorized**
```json
// empty
```

**403 Forbidden**
```json
// empty
```

**404 Not Found**
```json
// empty
```

## POST /api/problems/:id/comments

### Request

**Headers**
```json
{
  "auhtorization": "Bearer jwt-token"
}
```

**Path**
```json
{
  "id": 123
}
```

**Body**
```json
{
  "content": "Муниципалитет не решил проблему, ассинезаторы не приехали"
}
```

### Response

**201 Created**
```json
{
  "id": 123,
  "content": "aaaaaaaaaaa",
  "author": {
    "firstName": "Светлана",
    "lastName": "Камбулова", // may be empty for mods
    "middleName": "Отчество", // may be empty for mods
    "avatarUrl": "https://host.com/uploads/avatar.png"
  }
}
```

**401 Unaothorized**
```json
// empty
```

**403 Forbidden**
```json
// empty
```

**404 Not Found**
```json
// empty
```
