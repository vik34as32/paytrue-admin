export const USER_FILE_FIELDS = {
  profileImage: "profileImage",
  aadhaarFront: "aadhaarFront",
  aadhaarBack: "aadhaarBack",
  panCard: "panCard",
  ownerPhoto: "ownerPhoto",
  videoVerification: "videoVerification",
  passbookImage: "passbookImage",
  cancelledChequeImage: "cancelledChequeImage",
} as const;

export type UserFileFieldKey = keyof typeof USER_FILE_FIELDS;
