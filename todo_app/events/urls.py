from django.urls import path, re_path
from events import views

urlpatterns = [
    path('', views.spa_shell, name='spa-shell'),
    path('error-boundary', views.error_boundary, name='error-boundary'),
    re_path(r'^(?!error-boundary$).*$', views.spa_shell),
]