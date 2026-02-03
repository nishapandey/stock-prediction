from accounts.views import RegisterView
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from accounts.views import ProtectedView
from api.views import StockPredictionAPIView
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='access_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    path('token/verify/', TokenVerifyView.as_view(), name='verify_token'),
    path('protected/', ProtectedView.as_view(), name='protected'),
    path('predict/', StockPredictionAPIView.as_view(), name='predict'),
]
