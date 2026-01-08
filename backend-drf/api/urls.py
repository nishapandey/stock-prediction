from accounts.views import RegisterView
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='access_token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    path('token/verify/', TokenVerifyView.as_view(), name='verify_token'),
]
