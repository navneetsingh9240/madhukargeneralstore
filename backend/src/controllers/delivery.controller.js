const prisma = require('../config/db');

// GET /api/delivery/check/:pincode
async function checkPincode(req, res) {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        isServiceable: false,
        message: 'Please provide a valid 6-digit Indian PIN code',
      });
    }

    const area = await prisma.deliveryArea.findUnique({
      where: { pincode },
    });

    if (!area) {
      // Auto-create serviceable delivery area record for newly detected valid 6-digit Indian PIN codes
      area = await prisma.deliveryArea.create({
        data: {
          pincode,
          area: 'Standard Delivery Area',
          city: 'Standard City',
          state: 'Standard State',
          deliveryCharge: 30,
          minimumOrderAmount: 50,
          estimatedDeliveryTime: 'Same Day / Next Day Delivery',
          isActive: true,
        },
      });
    }

    if (!area.isActive) {
      return res.status(200).json({
        success: true,
        isServiceable: false,
        message: `✕ Sorry, delivery is currently paused for PIN code ${pincode}`,
      });
    }

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
    return res.status(500).json({ success: false, message: 'Failed to check PIN code availability' });
  }
}

// GET /api/addresses
async function getUserAddresses(req, res) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return res.json({ success: true, data: addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch addresses' });
  }
}

// POST /api/addresses
async function addAddress(req, res) {
  try {
    const { fullName, mobileNumber, houseFlat, streetArea, city, state, pincode, latitude, longitude, mapUrl, isDefault } = req.body;

    if (!fullName || !mobileNumber || !houseFlat || !streetArea || !city || !state || !pincode) {
      return res.status(400).json({ success: false, message: 'All mandatory address fields including 6-digit PIN code are required' });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'PIN code must be exactly 6 digits' });
    }

    // Check or auto-create PIN code delivery area
    let deliveryArea = await prisma.deliveryArea.findUnique({ where: { pincode } });
    if (!deliveryArea) {
      deliveryArea = await prisma.deliveryArea.create({
        data: {
          pincode,
          area: streetArea || 'Standard Area',
          city: city || 'Standard City',
          state: state || 'Standard State',
          deliveryCharge: 30,
          minimumOrderAmount: 50,
          estimatedDeliveryTime: 'Same Day / Next Day Delivery',
          isActive: true,
        },
      });
    }

    if (!deliveryArea.isActive) {
      return res.status(400).json({
        success: false,
        message: `Delivery is currently paused in PIN code area ${pincode}. Please enter a serviceable PIN code.`,
      });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const addressCount = await prisma.address.count({ where: { userId: req.user.id } });

    const computedMapUrl = mapUrl || (latitude && longitude ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${houseFlat}, ${streetArea}, ${city}, ${state} ${pincode}`)}`);

    const newAddress = await prisma.address.create({
      data: {
        userId: req.user.id,
        fullName,
        mobileNumber,
        houseFlat,
        streetArea,
        city,
        state,
        pincode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        mapUrl: computedMapUrl,
        isDefault: isDefault || addressCount === 0,
      },
    });

    return res.status(201).json({ success: true, message: 'Address saved successfully', data: newAddress });
  } catch (error) {
    console.error('Add address error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save address' });
  }
}

// DELETE /api/addresses/:id
async function deleteAddress(req, res) {
  try {
    const { id } = req.params;

    const address = await prisma.address.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!address) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await prisma.address.delete({ where: { id } });

    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete address' });
  }
}

module.exports = {
  checkPincode,
  getUserAddresses,
  addAddress,
  deleteAddress,
};