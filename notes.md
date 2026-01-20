
Notes:
activate virtual env: 
source venv/bin/activate

react commands:

npm create vite@latest

npm install

npm run dev


django commands:
https://djecrety.ir/
https://pypi.org/project/python-decouple/
pip install djangorestframework

django-admin startproject stock_prediction_main .

python manage.py runserver

python manage.py migrate

python manage.py  startapp accounts



django apps flow

model > serialization > views > urls 

http://127.0.0.1:8000/api/v1/register/
http://localhost:5173/register

curl   -X POST   -H "Content-Type: application/json"   -d '{"username": "test123", "password": "test123"}'   http://localhost:8000/api/v1/token/

http://127.0.0.1:8000/api/v1/token/


