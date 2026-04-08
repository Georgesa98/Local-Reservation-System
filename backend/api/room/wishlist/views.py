from django.db import IntegrityError, transaction
from django.shortcuts import render
from rest_framework.views import APIView, status
from rest_framework.permissions import IsAuthenticated
from .WishlistService import (
    add_wishlist,
    check_if_wishlisted,
    list_user_wishlists,
    remove_wishlist,
)
from .serializers import WishlistSerializer
from config.utils import SuccessResponse, ErrorResponse
from django.core.paginator import Paginator, EmptyPage
from django.core.exceptions import ValidationError as DjangoValidationError


class ListToggleWishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        try:
            page_number = int(request.query_params.get("page", 1))
            page_size = int(request.query_params.get("page_size", 10))
        except ValueError:
            return ErrorResponse(
                message="Invalid pagination parameters",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        page_size = min(page_size, 100)
        queryset = list_user_wishlists(user_id)
        paginator = Paginator(queryset, page_size)
        try:
            page = paginator.page(page_number)
        except EmptyPage:
            return ErrorResponse(
                message="Invalid page number", status_code=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return ErrorResponse(
                {"error": str(e)}, status_code=status.HTTP_400_BAD_REQUEST
            )
        serializer = WishlistSerializer(page.object_list, many=True)
        response_data = {
            "count": paginator.count,
            "next": page.next_page_number() if page.has_next() else None,
            "previous": page.previous_page_number() if page.has_previous() else None,
            "results": serializer.data,
        }
        return SuccessResponse(
            data=response_data, message="Wishlists retrieved successfully"
        )

    def post(self, request):
        serializer = WishlistSerializer(data=request.data)
        if not serializer.is_valid():
            return ErrorResponse(
                message="Validation failed",
                errors=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        try:
            is_wishlisted = check_if_wishlisted(
                request.user, serializer.validated_data["room"]
            )

            if not is_wishlisted:
                with transaction.atomic():
                    add_wishlist(request.user, serializer.validated_data["room"])
                return SuccessResponse(
                    message="Room added to wishlist successfully",
                    status_code=status.HTTP_201_CREATED,
                )
            else:
                remove_wishlist(request.user, serializer.validated_data["room"])
                return SuccessResponse(
                    message="Room removed from wishlist successfully",
                    status_code=status.HTTP_200_OK,
                )
        except IntegrityError:
            return ErrorResponse(
                message="Wishlist state changed concurrently",
                errors={"detail": "Please try again"},
                status_code=status.HTTP_409_CONFLICT,
            )
        except DjangoValidationError as e:
            return ErrorResponse(
                message=str(e),
                errors={"detail": str(e)},
                status_code=status.HTTP_400_BAD_REQUEST,
            )
