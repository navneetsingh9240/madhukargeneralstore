const prisma = require('../config/db');

// ============================================================
// CHECK DELIVERY PIN CODE
// ============================================================

// GET /api/delivery/check/:pincode
async function checkPincode(req, res) {
  try {
    const pincode = String(req.params.pincode || '').trim();

    // --------------------------------------------------------
    // Validate 6-digit Indian PIN code
    // --------------------------------------------------------

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        isServiceable: false,
        message: 'Please provide a valid 6-digit Indian PIN code',
      });
    }

    // --------------------------------------------------------
    // Find delivery area
    // IMPORTANT:
    // Only admin-created delivery areas are considered valid.
    // Customer-entered PIN codes are NEVER auto-created.
    // --------------------------------------------------------

    const area = await prisma.deliveryArea.findUnique({
      where: {
        pincode,
      },
    });

    // --------------------------------------------------------
    // PIN code is not added by admin
    // --------------------------------------------------------

    if (!area) {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        message: `✕ Pincode ${pincode} is not available for delivery`,
      });
    }

    // --------------------------------------------------------
    // Delivery disabled for this PIN
    // --------------------------------------------------------

    if (!area.isActive) {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        message: `✕ Sorry, delivery is currently paused for PIN code ${pincode}`,
      });
    }

    // --------------------------------------------------------
    // Delivery available
    // --------------------------------------------------------

    return res.json({
      success: true,
      isServiceable: true,
      message: `✓ Delivery available for PIN code ${pincode}`,
      data: {
        pincode: area.pincode,
        area: area.area,
        city: area.city,
        state: area.state,
        deliveryCharge: area.deliveryCharge,
        minimumOrderAmount: area.minimumOrderAmount,
        estimatedDeliveryTime: area.estimatedDeliveryTime,
      },
    });
  } catch (error) {
    console.error('Check pincode error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to check PIN code availability',
    });
  }
}

// ============================================================
// GET USER ADDRESSES
// ============================================================

// GET /api/addresses
async function getUserAddresses(req, res) {
  try {
    const addresses = await prisma.address.findMany({
      where: {
        userId: req.user.id,
      },

      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('Get user addresses error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
    });
  }
}

// ============================================================
// ADD USER ADDRESS
// ============================================================

// POST /api/addresses
async function addAddress(req, res) {
  try {
    const {
      fullName,
      mobileNumber,
      houseFlat,
      streetArea,
      city,
      state,
      pincode,
      latitude,
      longitude,
      mapUrl,
      isDefault,
    } = req.body;

    // --------------------------------------------------------
    // Normalize input
    // --------------------------------------------------------

    const cleanFullName = String(fullName || '').trim();
    const cleanMobileNumber = String(mobileNumber || '').trim();
    const cleanHouseFlat = String(houseFlat || '').trim();
    const cleanStreetArea = String(streetArea || '').trim();
    const cleanCity = String(city || '').trim();
    const cleanState = String(state || '').trim();
    const cleanPincode = String(pincode || '').trim();

    // --------------------------------------------------------
    // Validate mandatory fields
    // --------------------------------------------------------

    if (
      !cleanFullName ||
      !cleanMobileNumber ||
      !cleanHouseFlat ||
      !cleanStreetArea ||
      !cleanCity ||
      !cleanState ||
      !cleanPincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          'All mandatory address fields including 6-digit PIN code are required',
      });
    }

    // --------------------------------------------------------
    // Validate PIN code
    // --------------------------------------------------------

    if (!/^\d{6}$/.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: 'PIN code must be exactly 6 digits',
      });
    }

    // --------------------------------------------------------
    // Check delivery area
    //
    // IMPORTANT:
    // Only PIN codes added by Admin are accepted.
    // Do NOT auto-create a DeliveryArea here.
    // --------------------------------------------------------

    const deliveryArea = await prisma.deliveryArea.findUnique({
      where: {
        pincode: cleanPincode,
      },
    });

    // --------------------------------------------------------
    // PIN code not available for delivery
    // --------------------------------------------------------

    if (!deliveryArea) {
      return res.status(400).json({
        success: false,
        message: `Pincode ${cleanPincode} is not available for delivery. Please enter a serviceable PIN code.`,
      });
    }

    // --------------------------------------------------------
    // Check whether delivery is active
    // --------------------------------------------------------

    if (!deliveryArea.isActive) {
      return res.status(400).json({
        success: false,
        message: `Delivery is currently paused in PIN code area ${cleanPincode}. Please enter a serviceable PIN code.`,
      });
    }

    // --------------------------------------------------------
    // Handle default address
    // --------------------------------------------------------

    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: req.user.id,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // --------------------------------------------------------
    // Check existing address count
    // --------------------------------------------------------

    const addressCount = await prisma.address.count({
      where: {
        userId: req.user.id,
      },
    });

    // --------------------------------------------------------
    // Prepare Google Maps URL
    // --------------------------------------------------------

    let computedMapUrl = mapUrl || null;

    if (!computedMapUrl && latitude != null && longitude != null) {
      computedMapUrl =
        `https://www.google.com/maps/dir/?api=1&destination=` +
        `${latitude},${longitude}`;
    }

    if (!computedMapUrl) {
      computedMapUrl =
        `https://www.google.com/maps/dir/?api=1&destination=` +
        `${encodeURIComponent(
          `${cleanHouseFlat}, ${cleanStreetArea}, ${cleanCity}, ${cleanState} ${cleanPincode}`
        )}`;
    }

    // --------------------------------------------------------
    // Convert coordinates safely
    // --------------------------------------------------------

    const parsedLatitude =
      latitude !== undefined &&
      latitude !== null &&
      latitude !== ''
        ? Number(latitude)
        : null;

    const parsedLongitude =
      longitude !== undefined &&
      longitude !== null &&
      longitude !== ''
        ? Number(longitude)
        : null;

    // --------------------------------------------------------
    // Create address
    // --------------------------------------------------------

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,

        fullName: cleanFullName,
        mobileNumber: cleanMobileNumber,
        houseFlat: cleanHouseFlat,
        streetArea: cleanStreetArea,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,

        latitude:
          parsedLatitude !== null && Number.isFinite(parsedLatitude)
            ? parsedLatitude
            : null,

        longitude:
          parsedLongitude !== null && Number.isFinite(parsedLongitude)
            ? parsedLongitude
            : null,

        mapUrl: computedMapUrl,

        isDefault: Boolean(isDefault) || addressCount === 0,
      },
    });

    // --------------------------------------------------------
    // Success response
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: 'Address saved successfully',
      data: newAddress,
    });
  } catch (error) {
    // Detailed server-side logging for Render debugging
    console.error('======================================');
    console.error('ADD ADDRESS ERROR');
    console.error('======================================');
    console.error('Error name:', error?.name);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    console.error('Error meta:', error?.meta);
    console.error('Full error:', error);
    console.error('======================================');

    return res.status(500).json({
      success: false,
      message: 'Failed to save address',
    });
  }
}

// ============================================================
// DELETE USER ADDRESS
// ============================================================

// DELETE /api/addresses/:id
async function deleteAddress(req, res) {
  try {
    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: {
        id,
        userId: req.user.id,
      },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      });
    }

    await prisma.address.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    console.error('Delete address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete address',
    });
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  checkPincode,
  getUserAddresses,
  addAddress,
  deleteAddress,
};