from django.urls import path
from . import views

app_name = 'acadtalk'

urlpatterns = [
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversations'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListCreateView.as_view(), name='conversation-messages'),
    path('messages/<int:message_id>/read/', views.MessageReadView.as_view(), name='message-read'),
    path('messages/<int:message_id>/', views.MessageDeleteView.as_view(), name='message-delete'),
    path('unread-count/', views.UnreadCountView.as_view(), name='unread-count'),
]
