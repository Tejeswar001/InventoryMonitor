'use client'

import { useState, useEffect, useContext, useRef } from 'react';
import { firestore, storage, auth } from '@/firebase';
import { Box, Typography, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Card, CardContent, CardActions, CardMedia } from '@mui/material';
import { collection, query, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AuthContext } from '@/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import imageCompression from 'browser-image-compression';

export default function Home() {
  const { user, signOut } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemCount, setItemCount] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemImage, setItemImage] = useState(null);
  const [expirationDate, setExpirationDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentItem, setCurrentItem] = useState(null);
  const [openSignIn, setOpenSignIn] = useState(false);
  const [openSignUp, setOpenSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraImage, setCameraImage] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const updateInventory = async () => {
    try {
      const q = query(collection(firestore, 'inventory'));
      const snapshot = await getDocs(q);
      const inventoryList = [];
      snapshot.forEach((doc) => {
        inventoryList.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setInventory(inventoryList);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleAddItem = async () => {
    if (!itemName || !itemCount || !itemCategory || !expirationDate) {
      alert('Item Name, Quantity, Category, and Expiration Date are required.');
      return;
    }

    try {
      let imageUrl = '';
      if (itemImage) {
        const compressedImage = await imageCompression(itemImage, {
          maxSizeMB: 1, // Adjust to your needs
          maxWidthOrHeight: 800, // Adjust to your needs
        });
        const imageRef = ref(storage, `inventory/${compressedImage.name}`);
        await uploadBytes(imageRef, compressedImage);
        imageUrl = await getDownloadURL(imageRef);
      }
      await addDoc(collection(firestore, 'inventory'), {
        name: itemName,
        count: Number(itemCount),
        category: itemCategory,
        expirationDate: expirationDate,
        imageUrl: imageUrl,
      });
      setItemName('');
      setItemCount('');
      setItemCategory('');
      setExpirationDate(''); // Reset expiration date
      setItemImage(null);
      setCameraImage(null);
      setOpenAdd(false);
      updateInventory();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleEditItem = async () => {
    if (!itemName || !itemCount || !itemCategory || !expirationDate) {
      alert('Item Name, Quantity, Category, and Expiration Date are required.');
      return;
    }

    try {
      let imageUrl = currentItem.imageUrl;
      if (itemImage) {
        const compressedImage = await imageCompression(itemImage, {
          maxSizeMB: 1, // Adjust to your needs
          maxWidthOrHeight: 800, // Adjust to your needs
        });
        const imageRef = ref(storage, `inventory/${compressedImage.name}`);
        await uploadBytes(imageRef, compressedImage);
        imageUrl = await getDownloadURL(imageRef);
      }
      await updateDoc(doc(firestore, 'inventory', currentItem.id), {
        name: itemName,
        count: Number(itemCount),
        category: itemCategory,
        expirationDate: expirationDate,
        imageUrl: imageUrl,
      });
      setCurrentItem(null);
      setItemName('');
      setItemCount('');
      setItemCategory('');
      setExpirationDate(''); // Reset expiration date
      setItemImage(null);
      setCameraImage(null);
      setOpenEdit(false);
      updateInventory();
    } catch (error) {
      console.error('Error editing item:', error);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(firestore, 'inventory', id));
      updateInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setOpenSignIn(false);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setOpenSignUp(false);
    } catch (error) {
      console.error('Error signing up:', error);
    }
  };

  const handleOpenEditDialog = (item) => {
    setCurrentItem(item);
    setItemName(item.name);
    setItemCount(item.count);
    setItemCategory(item.category);
    setExpirationDate(item.expirationDate); // Set expiration date
    setOpenEdit(true);
  };

  useEffect(() => {
    if (user) {
      updateInventory();
    }
  }, [user]);

  useEffect(() => {
    if (cameraOpen) {
      const startCamera = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        } catch (err) {
          console.error('Error accessing camera:', err);
        }
      };
      startCamera();
    } else if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  }, [cameraOpen]);

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
      setCameraImage(file);
      setCameraOpen(false);
      setItemImage(file);  // Set the captured image as the item image
    });
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate expired and non-expired items
  const today = new Date();
  const nonExpiredItems = filteredInventory.filter(item => new Date(item.expirationDate) >= today);
  const expiredItems = filteredInventory.filter(item => new Date(item.expirationDate) < today);

  return (
    <Box>
      <Box display="flex" justifyContent="center" alignItems="center" p={2} position="relative">
        <Typography variant="h2">Inventory Monitor</Typography>
        {user && (
          <Button
            variant="contained"
            color="secondary"
            onClick={signOut}
            sx={{ position: 'absolute', right: '16px' }}
          >
            Sign Out
          </Button>
        )}
      </Box>
      
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        {!user ? (
          <>
            <Typography 
              variant="h5" 
              align="center"
              sx={{ 
                maxWidth: '70%', 
                padding: '20px', 
                borderRadius: '8px', 
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)', 
                backgroundColor: 'white',
                marginBottom: '20px'
              }}
            >
              Welcome to the Inventory Management System! We're thrilled to have you here. Our application is designed to help you efficiently manage your inventory with ease. Whether you’re tracking items, organizing categories, or keeping an eye on expiration dates, our intuitive interface and powerful features are here to streamline your experience. Begin by signing up to create your account or log in to access your existing inventory.
            </Typography>

            <Box display="flex" flexDirection="row" justifyContent="center" gap={2} flexWrap="wrap" sx={{ mb: 4 }}>
              <Card sx={{ maxWidth: 345 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image="/pictures/Pic1.png" // Replace with actual image path
                  alt="Feature 1"
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    Real-Time Inventory Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                  Keep an up-to-date view of your inventory with real-time tracking. Our system updates the inventory levels instantly as items are added, edited, or removed, ensuring you always have accurate information at your fingertips. 
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ maxWidth: 345 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image="/pictures/Pic2.png" // Replace with actual image path
                  alt="Feature 2"
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    Flexible Image Uploads
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enhance your inventory entries with visual details. You can upload images of items both from your device and directly from your camera. Whether you’re adding new products or updating existing ones. 
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ maxWidth: 345 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image="/pictures/Pic3.png" // Replace with actual image path
                  alt="Feature 3"
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    Expiration Date Alerts
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                  Stay ahead of potential issues with our expiration date alerts. The system highlights items nearing their expiration date, helping you take action before they become obsolete. 
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </>
        ) : (
          <Typography variant="h5">Manage your inventory by adding, editing, or deleting items. Use the search bar to find items quickly.</Typography>
        )}
      </Box>


      <Box display="flex" justifyContent="center" p={2}>
        {!user ? (
          <>
            <Button variant="contained" onClick={() => setOpenSignUp(true)} sx={{ ml: 2 }}>Sign Up</Button>
            <Button variant="contained" onClick={() => setOpenSignIn(true)} sx={{ ml: 2 }}>Log In</Button>
          </>
        ) : null}
      </Box>

      {user && (
        <>
          <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
            <TextField
              label="Search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, maxWidth: 600, marginRight: 2 }}
            />
            <Button variant="contained" color="primary" onClick={() => setOpenAdd(true)}>Add Item</Button>
          </Box>

          <Box mt={4}>
            <Typography variant="h4" gutterBottom style={{paddingLeft:'40px'}}>Non-Expired Items</Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mt={2} sx={{ padding: 2 }}>
              {nonExpiredItems.map((item) => (
                <Card key={item.id} sx={{ minWidth: 275, marginBottom: 2 }}>
                  <CardContent>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: '300px', height: '200px', objectFit: 'cover', marginBottom: '16px' }} />}
                    <Typography variant="h5" component="div">{item.name}</Typography>
                    <Typography color="textSecondary">Category: {item.category}</Typography>
                    <Typography variant="body2">Quantity: {item.count}</Typography>
                    <Typography color="textSecondary">Expiration Date: {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A'}</Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(item)}
                      sx={{ marginRight: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>

            <Typography variant="h4" style={{paddingLeft:'40px'}} gutterBottom>Expired Items</Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mt={2} sx={{ padding: 2 }}>
              {expiredItems.map((item) => (
                <Card key={item.id} sx={{ minWidth: 275, marginBottom: 2 }}>
                  <CardContent>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} style={{ width: '300px', height: '200px', objectFit: 'cover', marginBottom: '16px' }} />}
                    <Typography variant="h5" component="div">{item.name}</Typography>
                    <Typography color="textSecondary">Category: {item.category}</Typography>
                    <Typography variant="body2">Quantity: {item.count}</Typography>
                    <Typography color="textSecondary">Expiration Date: {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A'}</Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handleOpenEditDialog(item)}
                      sx={{ marginRight: 1 }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      color="secondary"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              ))}
            </Box>
          </Box>
        </>
      )}

      {/* Add Item Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Item Name"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={itemCount}
            onChange={(e) => setItemCount(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Expiration Date"
            type="date"
            fullWidth
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={() => setCameraOpen(true)} sx={{ mt: 2 }}>Use Camera</Button>
          {itemImage && <img src={URL.createObjectURL(itemImage)} alt="Preview" style={{ width: '100%', height: 'auto', marginTop: '16px' }} />}
          <input
            accept="image/*"
            type="file"
            onChange={(e) => setItemImage(e.target.files[0])}
            style={{ display: 'none' }}
            id="upload-image"
          />
          <label htmlFor="upload-image">
            <Button variant="contained" component="span" sx={{ mt: 2 }}>Upload Image</Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button onClick={handleAddItem}>Add Item</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Item Name"
            fullWidth
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={itemCount}
            onChange={(e) => setItemCount(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Expiration Date"
            type="date"
            fullWidth
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="contained" onClick={() => setCameraOpen(true)} sx={{ mt: 2 }}>Use Camera</Button>
          {itemImage && <img src={URL.createObjectURL(itemImage)} alt="Preview" style={{ width: '100%', height: 'auto', marginTop: '16px' }} />}
          <input
            accept="image/*"
            type="file"
            onChange={(e) => setItemImage(e.target.files[0])}
            style={{ display: 'none' }}
            id="upload-image-edit"
          />
          <label htmlFor="upload-image-edit">
            <Button variant="contained" component="span" sx={{ mt: 2 }}>Upload Image</Button>
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button onClick={handleEditItem}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Sign In Dialog */}
      <Dialog open={openSignIn} onClose={() => setOpenSignIn(false)}>
        <DialogTitle>Login In</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignIn(false)}>Cancel</Button>
          <Button onClick={handleSignIn}>Login In</Button>
        </DialogActions>
      </Dialog>

      {/* Sign Up Dialog */}
      <Dialog open={openSignUp} onClose={() => setOpenSignUp(false)}>
        <DialogTitle>Sign Up</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSignUp(false)}>Cancel</Button>
          <Button onClick={handleSignUp}>Sign Up</Button>
        </DialogActions>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={() => setCameraOpen(false)} maxWidth="md">
        <DialogTitle>Capture Image</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" alignItems="center">
            <video ref={videoRef} style={{ width: '100%', height: 'auto' }}></video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <Button variant="contained" color="primary" onClick={handleCapture} sx={{ mt: 2 }}>Capture</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCameraOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
