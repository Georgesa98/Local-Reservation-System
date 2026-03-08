from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..serializers import RoomSerializer
from ..services import RoomService
from ..permissions import IsAdmin
from .pagination import RoomPagination


class AdminRoomListView(APIView):
    """
    GET /api/rooms/admin/
    Returns all rooms across all managers. No user-scope filter.
    Supports optional ?manager=<id> filter.
    Auth: IsAuthenticated + IsAdmin
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        filters = {}
        if "location" in request.GET:
            filters["location"] = request.GET["location"]
        if "base_price_per_night" in request.GET:
            filters["base_price_per_night"] = request.GET["base_price_per_night"]
        if "capacity" in request.GET:
            filters["capacity"] = request.GET["capacity"]
        if "average_rating" in request.GET:
            filters["average_rating"] = request.GET["average_rating"]
        if "manager" in request.GET:
            filters["manager"] = request.GET["manager"]
        if "is_active" in request.GET:
            filters["is_active"] = request.GET["is_active"].lower() == "true"

        queryset = RoomService.list_rooms(filters=filters)  # no scope_to_manager

        paginator = RoomPagination()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            serializer = RoomSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = RoomSerializer(queryset, many=True)
        return Response(serializer.data)


class AdminRoomDetailView(APIView):
    """
    GET/PATCH/DELETE /api/rooms/admin/<pk>/
    Full room access for admins — no IsRoomManager ownership check.
    Auth: IsAuthenticated + IsAdmin
    """

    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        room = RoomService.get_room(pk)
        serializer = RoomSerializer(room)
        return Response(serializer.data)

    def patch(self, request, pk):
        room = RoomService.get_room(pk)
        serializer = RoomSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            RoomService.update_room(pk, serializer.validated_data)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        RoomService.delete_room(pk)
        return Response(status=status.HTTP_204_NO_CONTENT)
