from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Room, RoomImage
from .serializers import RoomSerializer, RoomImageSerializer
from .services import RoomService
from .permissions import IsManager, IsRoomManager


class RoomListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

    def get(self, request):
        rooms = RoomService.list_rooms(user=request.user)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            RoomService.create_room(serializer.validated_data, request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomDetailView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def get(self, request, pk):
        room = RoomService.get_room(pk, request.user)
        serializer = RoomSerializer(room)
        return Response(serializer.data)

    def put(self, request, pk):
        room = RoomService.get_room(pk, request.user)
        serializer = RoomSerializer(room, data=request.data)
        if serializer.is_valid():
            RoomService.update_room(pk, serializer.validated_data, request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        room = RoomService.get_room(pk, request.user)
        serializer = RoomSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            RoomService.update_room(pk, serializer.validated_data, request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        RoomService.delete_room(pk, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomImageCreateView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        serializer = RoomImageSerializer(data=request.data)
        if serializer.is_valid():
            RoomService.add_room_image(room_id, **serializer.validated_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomImageDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def delete(self, request, room_id, image_id):
        image = get_object_or_404(RoomImage, id=image_id, room_id=room_id)
        self.check_object_permissions(request, image.room)
        RoomService.remove_room_image(image_id)
        return Response(status=status.HTTP_204_NO_CONTENT)
