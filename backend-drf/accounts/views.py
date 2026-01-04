from django.shortcuts import render
from .serializers import UserSerializer
from rest_framework.generics import CreateAPIView
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny


class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    authentication_classes = []  # Disable CSRF for this public endpoint


