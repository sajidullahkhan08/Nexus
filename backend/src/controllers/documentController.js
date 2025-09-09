const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

// Get all documents for the authenticated user
const getDocuments = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, category, status, search } = req.query;

    // Build query
    const query = {
      $or: [
        { owner: userId },
        { 'sharedWith.user': userId }
      ]
    };

    if (category) query.category = category;
    if (status) query.status = status;

    // Search functionality
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: new RegExp(search, 'i') },
          { description: new RegExp(search, 'i') },
          { tags: new RegExp(search, 'i') }
        ]
      });
    }

    const documents = await Document.find(query)
      .populate('owner', 'name email')
      .populate('sharedWith.user', 'name email')
      .populate('signatures.user', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Document.countDocuments(query);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch documents'
    });
  }
};

// Get document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('sharedWith.user', 'name email')
      .populate('signatures.user', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access
    const userId = req.user._id.toString();
    const hasAccess = document.owner.toString() === userId ||
      document.sharedWith.some(shared => shared.user.toString() === userId) ||
      document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment view count
    document.viewCount += 1;
    await document.save();

    res.json({
      success: true,
      data: { document }
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document'
    });
  }
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { name, description, category, tags, isPublic } = req.body;
    const userId = req.user._id;

    // Create document record
    const document = await Document.create({
      name: name || req.file.originalname,
      originalName: req.file.originalname,
      description,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      owner: userId,
      category: category || 'other',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic === 'true'
    });

    await document.populate('owner', 'name email');

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Upload document error:', error);

    // Clean up uploaded file if document creation failed
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
};

// Update document
const updateDocument = async (req, res) => {
  try {
    const { name, description, category, tags, status, isPublic } = req.body;
    const documentId = req.params.id;
    const userId = req.user._id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check ownership
    if (document.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    if (name) document.name = name;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (status) document.status = status;
    if (isPublic !== undefined) document.isPublic = isPublic === 'true';

    await document.save();
    await document.populate('owner', 'name email');

    res.json({
      success: true,
      message: 'Document updated successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update document'
    });
  }
};

// Delete document
const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check ownership
    if (document.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '../..', document.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete document record
    await Document.findByIdAndDelete(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

// Download document
const downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access
    const userId = req.user._id.toString();
    const hasAccess = document.owner.toString() === userId ||
      document.sharedWith.some(shared => shared.user.toString() === userId) ||
      document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Increment download count
    document.downloadCount += 1;
    await document.save();

    const filePath = path.join(__dirname, '../..', document.fileUrl);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
};

// Share document
const shareDocument = async (req, res) => {
  try {
    const { userId, permissions } = req.body;
    const documentId = req.params.id;
    const ownerId = req.user._id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check ownership
    if (document.owner.toString() !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already shared
    const existingShare = document.sharedWith.find(
      shared => shared.user.toString() === userId
    );

    if (existingShare) {
      existingShare.permissions = permissions;
    } else {
      document.sharedWith.push({
        user: userId,
        permissions: permissions || 'view'
      });
    }

    await document.save();
    await document.populate('sharedWith.user', 'name email');

    res.json({
      success: true,
      message: 'Document shared successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Share document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share document'
    });
  }
};

// Add signature to document
const addSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No signature image uploaded'
      });
    }

    const documentId = req.params.id;
    const userId = req.user._id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access
    const hasAccess = document.owner.toString() === userId.toString() ||
      document.sharedWith.some(shared => shared.user.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if already signed
    const existingSignature = document.signatures.find(
      sig => sig.user.toString() === userId.toString()
    );

    if (existingSignature) {
      // Update existing signature
      existingSignature.signatureUrl = `/uploads/signatures/${req.file.filename}`;
      existingSignature.signedAt = new Date();
      existingSignature.ipAddress = req.ip;
    } else {
      // Add new signature
      document.signatures.push({
        user: userId,
        signatureUrl: `/uploads/signatures/${req.file.filename}`,
        signedAt: new Date(),
        ipAddress: req.ip
      });
    }

    await document.save();
    await document.populate('signatures.user', 'name email');

    res.json({
      success: true,
      message: 'Signature added successfully',
      data: { document }
    });
  } catch (error) {
    console.error('Add signature error:', error);

    // Clean up uploaded file if signature addition failed
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to add signature'
    });
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  uploadDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  shareDocument,
  addSignature
};