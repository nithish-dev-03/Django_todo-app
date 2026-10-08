from django.urls import path
from events import views

# Mounted at 'api/' from todo_app.urls, NOT through the SPA catch-all: that
# pattern rejects any 'api/' prefix, so routes declared inside it are dead.
urlpatterns = [
    path('todos/stats/', views.stats_api, name='stats-api'),
    path('todos/reorder/', views.reorder_api, name='todo-reorder'),
    path('todos/', views.todos_api, name='todo-list'),
    path('todos/<int:pk>/', views.todo_detail, name='todo-detail'),
    path('todos/<int:pk>/toggle/', views.todo_toggle, name='todo-toggle'),
    path('tags/<int:pk>/', views.tag_detail, name='tag-detail'),
    path('tags/', views.tags_api, name='tags-api'),
]