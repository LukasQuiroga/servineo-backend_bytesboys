import userProfileModel, { IUserProfile } from '../models/userProfile.model';
import { Request, Response } from 'express';

export const createUserProfile = async (
  req: Request<{}, {}, IUserProfile>,
  res: Response<IUserProfile | { error: string }>
) => {
  try {
    const userProfile = new userProfileModel(req.body);
    await userProfile.save();
    res.status(201).json(userProfile);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserProfiles = async (
  _req: Request,
  res: Response<IUserProfile[] | { error: string }>
) => {
  try {
    const profiles = await userProfileModel.find();
    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBio = async (
  req: Request<{ id: string }, {}, { bio: string }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { bio } = req.body;
    const updated = await userProfileModel.findOneAndUpdate(
      { 'user.id': id },
      { $set: { 'profile.additionalInfo.bio': bio } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


export const getUsersByRole = async (
  req: Request<{ role: string }>,
  res: Response
) => {
  try {
    const { role } = req.params;
    const users = await userProfileModel.find({ 'user.role': role });
    res.json(users);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const convertToFixer = async (
  req: Request<{ id: string }, {}, { profile: any }>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { profile } = req.body;
    const updated = await userProfileModel.findOneAndUpdate(
      { 'user.id': id },
      { $set: { 'user.role': 'fixer', profile } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};