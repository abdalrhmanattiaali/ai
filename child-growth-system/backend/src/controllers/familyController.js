const Family = require('../models/Family');
const Child = require('../models/Child');
const Parent = require('../models/Parent');

// @desc    Get all families
// @route   GET /api/families
// @access  Private
exports.getFamilies = async (req, res, next) => {
  try {
    const families = await Family.find({ userId: req.user._id })
      .populate('children')
      .populate('parents')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: families.length,
      data: families
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single family
// @route   GET /api/families/:id
// @access  Private
exports.getFamily = async (req, res, next) => {
  try {
    const family = await Family.findOne({
      _id: req.params.id,
      userId: req.user._id
    })
      .populate('children')
      .populate('parents');

    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'الأسرة غير موجودة'
      });
    }

    res.status(200).json({
      success: true,
      data: family
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create family
// @route   POST /api/families
// @access  Private
exports.createFamily = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;

    const family = await Family.create(req.body);

    res.status(201).json({
      success: true,
      data: family
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update family
// @route   PUT /api/families/:id
// @access  Private
exports.updateFamily = async (req, res, next) => {
  try {
    let family = await Family.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'الأسرة غير موجودة'
      });
    }

    family = await Family.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: family
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete family
// @route   DELETE /api/families/:id
// @access  Private
exports.deleteFamily = async (req, res, next) => {
  try {
    const family = await Family.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'الأسرة غير موجودة'
      });
    }

    // Delete related data
    await Child.deleteMany({ familyId: family._id });
    await Parent.deleteMany({ familyId: family._id });

    await family.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get family statistics
// @route   GET /api/families/:id/statistics
// @access  Private
exports.getFamilyStatistics = async (req, res, next) => {
  try {
    const family = await Family.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!family) {
      return res.status(404).json({
        success: false,
        error: 'الأسرة غير موجودة'
      });
    }

    const childrenCount = await Child.countDocuments({ familyId: family._id });
    const parentsCount = await Parent.countDocuments({ familyId: family._id });

    res.status(200).json({
      success: true,
      data: {
        childrenCount,
        parentsCount,
        ...family.statistics
      }
    });
  } catch (error) {
    next(error);
  }
};
