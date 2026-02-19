from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Room, RoomImage
from .serializers import (
    RoomSerializer,
    RoomImageSerializer,
    PricingRuleSerializer,
    RoomAvailabilitySerializer,
)
from .services import RoomService, PricingRuleService, RoomAvailabilityService
from .permissions import IsManager, IsRoomManager


class RoomListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsManager]

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
        rooms = RoomService.list_rooms(filters=filters, user=request.user)
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
        self.check_object_permissions(request, room)
        serializer = RoomSerializer(room)
        return Response(serializer.data)

    def patch(self, request, pk):
        room = RoomService.get_room(pk, request.user)
        self.check_object_permissions(request, room)
        serializer = RoomSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            RoomService.update_room(pk, serializer.validated_data, request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        room = RoomService.get_room(pk, request.user)
        self.check_object_permissions(request, room)
        RoomService.delete_room(pk, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomImageCreateView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        images_data = request.data.get("images", [])
        images_list = []
        for img_data in images_data:
            serializer = RoomImageSerializer(data=img_data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            images_list.append(serializer.validated_data)
        created_images = RoomService.add_room_images(
            room_id, images_list, user=request.user
        )
        serializer = RoomImageSerializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RoomImageDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def delete(self, request, room_id, image_id):
        image = get_object_or_404(RoomImage, id=image_id, room_id=room_id)
        self.check_object_permissions(request, image.room)
        RoomService.remove_room_image(image_id)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PricingRuleListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def get(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        pricing_rules = PricingRuleService.list_pricing_rules(room_id, request.user)
        serializer = PricingRuleSerializer(pricing_rules, many=True)
        return Response(serializer.data)

    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        serializer = PricingRuleSerializer(data=request.data)
        if serializer.is_valid():
            pricing_rule = PricingRuleService.create_pricing_rule(
                room_id, serializer.validated_data, request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PricingRuleDetailView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def get(self, request, room_id, pk):
        pricing_rule = PricingRuleService.get_pricing_rule(room_id, pk, request.user)
        self.check_object_permissions(request, pricing_rule.room)
        serializer = PricingRuleSerializer(pricing_rule)
        return Response(serializer.data)

    def patch(self, request, room_id, pk):
        pricing_rule = PricingRuleService.get_pricing_rule(room_id, pk, request.user)
        self.check_object_permissions(request, pricing_rule.room)
        serializer = PricingRuleSerializer(
            pricing_rule, data=request.data, partial=True
        )
        if serializer.is_valid():
            updated_rule = PricingRuleService.update_pricing_rule(
                room_id, pk, serializer.validated_data, request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, room_id, pk):
        pricing_rule = PricingRuleService.get_pricing_rule(room_id, pk, request.user)
        self.check_object_permissions(request, pricing_rule.room)
        PricingRuleService.delete_pricing_rule(room_id, pk, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomPublicListView(APIView):
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
        # Force is_active=True for public
        filters["is_active"] = True
        rooms = RoomService.list_rooms(filters=filters)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


class RoomAvailabilityListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def get(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        filters = {}
        if "start_date" in request.GET:
            filters["start_date"] = request.GET["start_date"]
        if "end_date" in request.GET:
            filters["end_date"] = request.GET["end_date"]
        if "reason" in request.GET:
            filters["reason"] = request.GET["reason"]
        availabilities = RoomAvailabilityService.list_room_availabilities(
            room_id, filters=filters, user=request.user
        )
        serializer = RoomAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data)

    def post(self, request, room_id):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        data = request.data.copy()
        data["room"] = room.id
        serializer = RoomAvailabilitySerializer(data=data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data["room"] = room
            availability = RoomAvailabilityService.create_room_availability(
                validated_data, request.user
            )
            serializer = RoomAvailabilitySerializer(availability)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomAvailabilityDetailView(APIView):
    permission_classes = [IsAuthenticated, IsRoomManager]

    def get(self, request, room_id, pk):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        availability = RoomAvailabilityService.get_room_availability(
            room_id, pk, request.user
        )
        serializer = RoomAvailabilitySerializer(availability)
        return Response(serializer.data)

    def patch(self, request, room_id, pk):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        availability = RoomAvailabilityService.get_room_availability(
            room_id, pk, request.user
        )
        serializer = RoomAvailabilitySerializer(
            availability, data=request.data, partial=True
        )
        if serializer.is_valid():
            RoomAvailabilityService.update_room_availability(
                room_id, pk, serializer.validated_data, request.user
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, room_id, pk):
        room = get_object_or_404(Room, id=room_id)
        self.check_object_permissions(request, room)
        RoomAvailabilityService.delete_room_availability(room_id, pk, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)
